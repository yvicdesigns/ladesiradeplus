import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { validateRestaurantIdBeforeOrderCreation } from '@/lib/restaurantValidation';
import { logger } from '@/lib/logger';
import { OrderIdSyncService } from '@/lib/OrderIdSyncService';
import { notifyAdminsNewOrder } from '@/lib/notifyNewOrder';

export const useCreateOrder = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();

  const fetchMenuItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, menu_categories(name)')
        .or('is_deleted.eq.false,is_deleted.is.null');
        
      if (error) throw error;
      setMenuItems(data || []);
    } catch (err) {
      logger.error('[useCreateOrder] Error fetching menu items:', err);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger le menu.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const submitOrder = async (client, cart, orderDetails) => {
    setSubmitting(true);
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      logger.info(`[useCreateOrder] [${transactionId}] Starting atomic order creation...`);
      
      const validation = await validateRestaurantIdBeforeOrderCreation(restaurantId || orderDetails.restaurant_id);
      if (!validation.valid) {
        throw new Error(validation.error || "Le restaurant n'existe pas. Impossible de créer la commande.");
      }
      
      const safeRestaurantId = validation.restaurantId;
      const type = orderDetails.order_type; 
      const method = orderDetails.order_method || 'online'; 
      const baseTotal = cart.reduce((sum, item) => sum + ((item.price || item.finalPricePerUnit || 0) * item.quantity), 0);
      const totalToUse = orderDetails.finalTotal !== undefined ? orderDetails.finalTotal : baseTotal;
      const customerId = client?.id || null;

      // 1. Stock Validation
      const itemIds = cart.map(item => item.id || item.menu_item_id);
      const { data: stockData, error: stockError } = await supabase
        .from('menu_items')
        .select('id, name, stock_quantity')
        .in('id', itemIds);
        
      if (stockError) throw new Error("Erreur lors de la vérification des stocks.");

      for (const cartItem of cart) {
        const itemId = cartItem.id || cartItem.menu_item_id;
        const dbItem = stockData?.find(i => i.id === itemId);
        if (dbItem && dbItem.stock_quantity !== null && dbItem.stock_quantity < cartItem.quantity) {
          throw new Error(`Stock insuffisant pour "${dbItem.name}".`);
        }
      }

      // 2. Prepare RPC Payloads
      const itemsPayload = cart.map(item => ({
        menu_item_id: item.id || item.menu_item_id,
        quantity: item.quantity,
        price: item.price || item.finalPricePerUnit || 0,
        notes: item.notes || null,
        selected_variants: item.selectedVariants?.length > 0 ? JSON.stringify(item.selectedVariants) : null,
      }));

      let deliveryPayload = null;
      let restaurantPayload = null;

      if (type === 'delivery') {
        deliveryPayload = {
           customer_id: customerId,
           payment_status: orderDetails.payment_status || 'unpaid',
           payment_method: orderDetails.payment_method || null,
           mobile_money_type: orderDetails.mobile_money_type || null,
           payment_screenshot_url: orderDetails.payment_screenshot_url || null,
           delivery_fee: orderDetails.delivery_fee || 0,
           estimated_delivery_time_text: orderDetails.estimated_delivery_time_text || null,
           distance_km: orderDetails.distance_km || 0,
           calculated_delivery_fee: orderDetails.calculated_delivery_fee || 0,
           quarter_name: orderDetails.quarter_name || null,
           total: totalToUse // Add total explicitly to delivery payload
        };
      } else {
        restaurantPayload = {
           customer_id: customerId,
           payment_status: method === 'counter' ? 'paid' : (orderDetails.payment_status || 'unpaid'),
           payment_method: orderDetails.payment_method || null,
           mobile_money_type: orderDetails.mobile_money_type || null,
           payment_screenshot_url: orderDetails.payment_screenshot_url || null
        };
      }

      const rpcArgs = {
        p_user_id: client?.user_id || null,
        p_restaurant_id: safeRestaurantId,
        p_customer_name: client?.name || 'Client Anonyme',
        p_customer_phone: client?.phone || orderDetails.delivery_phone || null,
        p_customer_email: client?.email || null,
        p_delivery_address: orderDetails.delivery_address || null,
        p_order_type: type,
        p_table_id: orderDetails.table_id || null,
        p_order_method: method,
        p_items: itemsPayload,
        p_total: totalToUse,
        p_discount_breakdown: orderDetails.discount_breakdown || null,
        p_promo_code_id: orderDetails.promo_code_id || null,
        p_delivery_data: deliveryPayload,
        p_restaurant_data: restaurantPayload
      };

      // 3. Attempt Atomic RPC Insert
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_order_with_items', rpcArgs);

      if (rpcError) {
        logger.error(`[useCreateOrder] [${transactionId}] RPC failed:`, rpcError.message);
        throw new Error(rpcError.message || "Erreur de création de commande.");
      }

      const createdOrderId = rpcResult.order_id;
      logger.info(`[useCreateOrder] [${transactionId}] Atomic RPC successful. Generated Full Order ID: ${createdOrderId}`);

      // NEW: Validate Sync
      if (type === 'delivery') {
         const syncCheck = await OrderIdSyncService.verifyOrderDeliveryOrderSync(createdOrderId);
         if (!syncCheck.synced) {
             logger.warn(`[useCreateOrder] [${transactionId}] Order ID Sync Warning:`, syncCheck);
         } else {
             logger.info(`[useCreateOrder] [${transactionId}] Order ID properly synced: ${syncCheck.orderId} == ${syncCheck.recordedOrderId}`);
         }
      }

      // 4. Update Stock
      for (const cartItem of cart) {
        const itemId = cartItem.id || cartItem.menu_item_id;
        const dbItem = stockData?.find(i => i.id === itemId);
        if (dbItem && dbItem.stock_quantity !== null) {
          const newStock = dbItem.stock_quantity - cartItem.quantity;
          await supabase.from('menu_items').update({ stock_quantity: newStock }).eq('id', itemId);
          await supabase.from('item_stock_movements').insert({
            menu_item_id: itemId, movement_type: 'order_confirmed', quantity_changed: -cartItem.quantity,
            previous_quantity: dbItem.stock_quantity, new_quantity: newStock, order_id: createdOrderId, notes: `Déduction`
          });
        }
      }

      // 5. Increment promo code usage_count if a promo code was used
      if (orderDetails.promo_code_id) {
        const { data: promoRow } = await supabase
          .from('promo_codes')
          .select('usage_count')
          .eq('id', orderDetails.promo_code_id)
          .maybeSingle();
        if (promoRow) {
          await supabase
            .from('promo_codes')
            .update({ usage_count: (promoRow.usage_count || 0) + 1 })
            .eq('id', orderDetails.promo_code_id);
        }
      }

      notifyAdminsNewOrder({ orderType: type, customerName: client?.name || 'Client Anonyme', total: totalToUse });

      return { success: true, order: rpcResult.order };

    } catch (error) {
      logger.error(`[useCreateOrder] [${transactionId}] ❌ Error:`, error);
      const errorMsg = error.message || "Une erreur s'est produite lors de la commande.";
      toast({ variant: 'destructive', title: 'Erreur', description: errorMsg });
      return { success: false, error: new Error(errorMsg) };
    } finally {
      setSubmitting(false);
    }
  };

  return { menuItems, loading, submitting, fetchMenuItems, submitOrder };
};