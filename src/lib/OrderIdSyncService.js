import { supabase } from './customSupabaseClient';
import { logger } from './logger';

export const OrderIdSyncService = {
  /**
   * Verifies if a specific order and its delivery_order are properly synced.
   */
  async verifyOrderDeliveryOrderSync(orderId) {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, type')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      if (order.type === 'delivery') {
        const { data: deliveryOrder, error: doError } = await supabase
          .from('delivery_orders')
          .select('id, order_id')
          .eq('order_id', orderId)
          .maybeSingle();

        if (doError) throw doError;

        if (!deliveryOrder) {
          return { synced: false, message: 'No delivery_orders row found for this order yet', orderId: order.id };
        }

        return {
          synced: deliveryOrder.order_id === order.id,
          orderId: order.id,
          deliveryOrderId: deliveryOrder.id,
          recordedOrderId: deliveryOrder.order_id
        };
      }

      return { synced: true, message: 'Not a delivery order' };
    } catch (err) {
      logger.error('Error verifying sync:', err);
      return { synced: false, error: err.message };
    }
  },

  /**
   * Always extracts the main orders.id from any order object 
   * (whether it's an orders record or delivery_orders record).
   */
  getOrderIdForDisplay(orderRecord) {
    if (!orderRecord) return 'unknown';
    // If it has an order_id, it's likely a delivery_orders record, so return the parent ID.
    // Otherwise, it's likely the orders record itself.
    return orderRecord.order_id || orderRecord.id || 'unknown';
  },

  /**
   * Audits pairs for consistency (mostly checking for orphaned delivery_orders missing order_id).
   */
  async ensureOrderIdConsistency() {
    try {
      const { data: deliveryOrders, error } = await supabase
        .from('delivery_orders')
        .select('id, order_id');

      if (error) throw error;

      const mismatches = deliveryOrders.filter(d => !d.order_id);
      
      return {
        success: true,
        totalChecked: deliveryOrders.length,
        mismatchesCount: mismatches.length,
        mismatches
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Fixes a mismatch by explicitly setting the order_id.
   */
  async fixOrderIdMismatch(deliveryOrderId, correctOrderId) {
    try {
      const { error } = await supabase
        .from('delivery_orders')
        .update({ order_id: correctOrderId })
        .eq('id', deliveryOrderId);

      if (error) throw error;
      return { success: true, deliveryOrderId, fixedOrderId: correctOrderId };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};