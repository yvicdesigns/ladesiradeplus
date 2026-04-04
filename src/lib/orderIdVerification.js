import { supabase } from './customSupabaseClient';
import { logger } from './logger';

/**
 * Returns the FULL UUID without any formatting or truncation.
 * Used to standardize ID display across the application.
 */
export function formatOrderIdForDisplay(orderId) {
  if (!orderId) return 'unknown';
  return String(orderId);
}

/**
 * Verifies if an order ID exists consistently across tables.
 * Returns detailed diagnostic information.
 */
export async function verifyOrderIdConsistency(orderId) {
  try {
    const results = {
      orderId,
      inOrders: false,
      inDeliveryOrders: false,
      inRestaurantOrders: false,
      ordersRecord: null,
      deliveryRecord: null,
      restaurantRecord: null
    };

    // Check main orders table
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id, type, status')
      .eq('id', orderId)
      .single();
    
    if (orderData) {
      results.inOrders = true;
      results.ordersRecord = orderData;
    }

    // Check delivery_orders
    const { data: deliveryData } = await supabase
      .from('delivery_orders')
      .select('id, order_id, status')
      .eq('order_id', orderId)
      .single();
      
    if (deliveryData) {
      results.inDeliveryOrders = true;
      results.deliveryRecord = deliveryData;
    }

    // Check restaurant_orders
    const { data: restaurantData } = await supabase
      .from('restaurant_orders')
      .select('id, order_id, status')
      .eq('order_id', orderId)
      .single();

    if (restaurantData) {
      results.inRestaurantOrders = true;
      results.restaurantRecord = restaurantData;
    }

    logger.info(`[OrderIdVerification] Consistency check for ${orderId}:`, results);
    return { success: true, results };
  } catch (error) {
    logger.error(`[OrderIdVerification] Error verifying order ${orderId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Retrieves the main order_id from a delivery_order id.
 */
export async function getOrderIdFromDeliveryOrder(deliveryOrderId) {
  try {
    const { data, error } = await supabase
      .from('delivery_orders')
      .select('order_id')
      .eq('id', deliveryOrderId)
      .single();
      
    if (error) throw error;
    
    logger.info(`[OrderIdVerification] Fetched order_id ${data.order_id} for delivery_order ${deliveryOrderId}`);
    return data.order_id;
  } catch (error) {
    logger.error(`[OrderIdVerification] Error fetching order_id for delivery_order ${deliveryOrderId}:`, error);
    return null;
  }
}

/**
 * Diagnostic function to find mismatched or orphaned order IDs
 */
export async function findMismatchedOrderIds() {
  try {
    const { data: deliveryData, error: deliveryError } = await supabase
      .from('delivery_orders')
      .select('id, order_id');
      
    if (deliveryError) throw deliveryError;

    const mismatches = [];
    
    for (const d of deliveryData) {
      if (!d.order_id) {
         mismatches.push({ type: 'missing_fk', table: 'delivery_orders', record_id: d.id });
         continue;
      }
      
      // We could batch this, but for simple diagnostics, sequential is okay
      const { data: orderExists } = await supabase
        .from('orders')
        .select('id')
        .eq('id', d.order_id)
        .single();
        
      if (!orderExists) {
        mismatches.push({ type: 'orphaned', table: 'delivery_orders', record_id: d.id, foreign_key: d.order_id });
      }
    }

    logger.info('[OrderIdVerification] Mismatch diagnostic results:', mismatches);
    return { success: true, mismatches };
  } catch (error) {
    logger.error('[OrderIdVerification] Error running mismatch diagnostic:', error);
    return { success: false, error: error.message };
  }
}