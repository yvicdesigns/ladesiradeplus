import { supabase } from '@/lib/customSupabaseClient';
import { handleDeletionError } from './orderDeletionErrorHandler';

/**
 * Handles the cascading deletion of an order with extensive logging.
 * Deletes related records in child tables first, then the main order.
 * 
 * @param {string} orderId - The UUID of the order to delete
 * @returns {Promise<{success: boolean, error: any, diagnosticData?: any}>}
 */
export async function deleteOrder(orderId) {
  if (!orderId) {
    console.error('[Delete Flow] No order ID provided');
    return { success: false, error: handleDeletionError(new Error("No order ID provided")) };
  }

  console.log(`[Delete Flow] Initiating deletion process for Order ID: ${orderId}`);
  const diagnosticData = { steps: [] };

  try {
    // 1. Delete order items
    console.log(`[Delete Flow] Step 1: Executing DELETE FROM order_items WHERE order_id = '${orderId}'`);
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('[Delete Flow] Error in Step 1:', itemsError);
      diagnosticData.failedStep = 'order_items';
      throw itemsError;
    }
    diagnosticData.steps.push('order_items_deleted');

    // 2. Delete delivery orders (if exists)
    console.log(`[Delete Flow] Step 2: Executing DELETE FROM delivery_orders WHERE order_id = '${orderId}'`);
    const { error: deliveryError } = await supabase
      .from('delivery_orders')
      .delete()
      .eq('order_id', orderId);

    if (deliveryError) {
      console.error('[Delete Flow] Error in Step 2:', deliveryError);
      diagnosticData.failedStep = 'delivery_orders';
      throw deliveryError;
    }
    diagnosticData.steps.push('delivery_orders_deleted');

    // 3. Delete restaurant orders (if exists)
    console.log(`[Delete Flow] Step 3: Executing DELETE FROM restaurant_orders WHERE order_id = '${orderId}'`);
    const { error: restaurantError } = await supabase
      .from('restaurant_orders')
      .delete()
      .eq('order_id', orderId);

    if (restaurantError) {
       console.warn('[Delete Flow] Warning in Step 3:', restaurantError);
       // We log but don't strictly throw if it's just missing rows. If it's RLS, we should throw.
       if (restaurantError.code !== 'PGRST116') {
         diagnosticData.failedStep = 'restaurant_orders';
         throw restaurantError;
       }
    } else {
       diagnosticData.steps.push('restaurant_orders_deleted');
    }

    // 4. Finally, delete the order itself
    console.log(`[Delete Flow] Step 4: Executing DELETE FROM orders WHERE id = '${orderId}'`);
    const { error: orderError, data: deletedOrder } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)
      .select();

    if (orderError) {
      console.error('[Delete Flow] Error in Step 4:', orderError);
      diagnosticData.failedStep = 'main_order';
      throw orderError;
    }

    if (!deletedOrder || deletedOrder.length === 0) {
      console.warn(`[Delete Flow] Warning: Delete query returned 0 rows. RLS blocked it or order doesn't exist.`);
      const { data: verifyData } = await supabase.from('orders').select('id').eq('id', orderId).maybeSingle();
      if (verifyData) {
         throw new Error("La suppression a échoué silencieusement. Vérifiez les règles RLS.");
      }
    }

    console.log(`[Delete Flow] Successfully deleted Order ID: ${orderId}`);
    diagnosticData.steps.push('main_order_deleted');

    return { success: true, diagnosticData };
  } catch (error) {
    const handledError = handleDeletionError(error, { orderId, diagnosticData });
    return { success: false, error: handledError, diagnosticData };
  }
}