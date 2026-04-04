import { supabase } from '@/lib/customSupabaseClient';
import { normalizeSupabaseError, normalizeRPCError } from '@/lib/errorHandler';
import { ORDER_TRANSITIONS } from '@/constants/orderStatus';
import { logAudit } from '@/lib/auditLogUtils';
import { AUDIT_ACTIONS } from '@/constants/AUDIT_ACTIONS';

export const ordersService = {
  async createOrder(orderData) {
    try {
      const { data, error } = await supabase.rpc('create_order_with_items', {
        p_user_id: orderData.user_id,
        p_restaurant_id: orderData.restaurant_id,
        p_customer_name: orderData.customer_name,
        p_customer_phone: orderData.customer_phone,
        p_customer_email: orderData.customer_email || null,
        p_delivery_address: orderData.delivery_address || null,
        p_order_type: orderData.order_type,
        p_table_id: orderData.table_id || null,
        p_order_method: orderData.order_method || 'online',
        p_items: orderData.items,
        p_total: orderData.total,
        p_discount_breakdown: orderData.discount_breakdown || null,
        p_promo_code_id: orderData.promo_code_id || null,
        p_delivery_data: orderData.delivery_data || null,
        p_restaurant_data: orderData.restaurant_data || null
      });

      if (error) throw error;
      
      if (data?.order_id) {
        await logAudit(AUDIT_ACTIONS.INSERT, 'orders', data.order_id, data.order, 'Order created via RPC');
      }
      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeRPCError(err) };
    }
  },

  async getOrderById(id) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items(*, menu_items(*)), delivery_orders(*), restaurant_orders(*)`)
        .eq('id', id)
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeSupabaseError(err) };
    }
  },

  validateOrderTransition(currentStatus, newStatus) {
    const allowedTransitions = ORDER_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  },

  async updateOrderStatus(id, newStatus) {
    try {
      const { data, error } = await supabase.rpc('update_delivery_order_status', {
        p_order_id: id,
        p_new_status: newStatus
      });
      if (error) throw error;
      
      await logAudit(AUDIT_ACTIONS.UPDATE, 'orders', id, { status: newStatus }, `Order status updated to ${newStatus}`);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeRPCError(err) };
    }
  },

  async getOrdersByUser(userId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeSupabaseError(err) };
    }
  }
};