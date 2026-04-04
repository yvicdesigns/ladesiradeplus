import { supabase } from './customSupabaseClient';
import { logger } from './logger';

export const OrderIdTraceService = {
  async traceOrderById(orderId) {
    try {
      logger.info(`[OrderIdTraceService] Tracing order ID: ${orderId}`);
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
        
      if (orderError && orderError.code !== 'PGRST116') throw orderError;

      const { data: deliveryOrders, error: deliveryError } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('order_id', orderId);

      if (deliveryError) throw deliveryError;

      const { data: restaurantOrders, error: restError } = await supabase
        .from('restaurant_orders')
        .select('*')
        .eq('order_id', orderId);

      if (restError) throw restError;

      return {
        success: true,
        searchId: orderId,
        foundInOrders: !!order,
        orderRecord: order || null,
        deliveryOrders: deliveryOrders || [],
        restaurantOrders: restaurantOrders || [],
        status: order ? 'Valid' : 'NotFound'
      };
    } catch (error) {
      logger.error(`[OrderIdTraceService] Error tracing order:`, error);
      return { success: false, error: error.message };
    }
  },

  async traceDeliveryOrderById(deliveryOrderId) {
    try {
      logger.info(`[OrderIdTraceService] Tracing delivery order ID: ${deliveryOrderId}`);
      
      const { data: deliveryOrder, error: deliveryError } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('id', deliveryOrderId)
        .single();
        
      if (deliveryError && deliveryError.code !== 'PGRST116') throw deliveryError;

      let parentOrder = null;
      if (deliveryOrder && deliveryOrder.order_id) {
        const { data: order } = await supabase
          .from('orders')
          .select('*')
          .eq('id', deliveryOrder.order_id)
          .single();
        parentOrder = order;
      }

      return {
        success: true,
        searchId: deliveryOrderId,
        foundInDeliveryOrders: !!deliveryOrder,
        deliveryOrderRecord: deliveryOrder || null,
        parentOrderId: deliveryOrder?.order_id || null,
        parentOrderRecord: parentOrder || null,
        isOrphaned: deliveryOrder && !parentOrder
      };
    } catch (error) {
      logger.error(`[OrderIdTraceService] Error tracing delivery order:`, error);
      return { success: false, error: error.message };
    }
  },

  async findOrdersByCustomer(customerId, dateRange = 7) {
    try {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - dateRange);
      const isoDate = dateLimit.toISOString();

      const { data: orders } = await supabase
        .from('orders')
        .select('*, delivery_orders(*), restaurant_orders(*)')
        .eq('user_id', customerId)
        .gte('created_at', isoDate)
        .order('created_at', { ascending: false });

      return { success: true, orders: orders || [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async validateOrderDeliveryOrderRelationship(orderId) {
    const trace = await this.traceOrderById(orderId);
    if (!trace.success) return trace;

    if (!trace.foundInOrders) {
      return { valid: false, reason: 'Main order record not found' };
    }

    if (trace.orderRecord.type === 'delivery') {
      if (trace.deliveryOrders.length === 0) {
        return { valid: false, reason: 'Missing associated delivery_order record' };
      }
      if (trace.deliveryOrders.length > 1) {
        return { valid: false, reason: 'Multiple delivery_order records found for single order' };
      }
      
      const doRecord = trace.deliveryOrders[0];
      if (doRecord.order_id !== trace.orderRecord.id) {
        return { valid: false, reason: 'Foreign key mismatch (this should be impossible at DB level if FK is enforced)' };
      }
    }

    return { valid: true, reason: 'Relationship is consistent' };
  }
};