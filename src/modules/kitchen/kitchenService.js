import { supabase } from '@/lib/customSupabaseClient';
import { normalizeSupabaseError } from '@/lib/errorHandler';
import { ORDER_STATUSES } from '@/constants/orderStatus';
import { logAudit } from '@/lib/auditLogUtils';
import { AUDIT_ACTIONS } from '@/constants/AUDIT_ACTIONS';

export const kitchenService = {
  async getRestaurantOrders(restaurantId = '7eedf081-0268-4867-af38-61fa5932420a') {
    try {
      const { data, error } = await supabase
        .from('restaurant_orders')
        .select('*, orders(*, order_items(*, menu_items(*)))')
        .eq('is_deleted', false)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeSupabaseError(err) };
    }
  },

  async updateOrderStatus(orderId, status) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      if (error) throw error;
      
      await logAudit(AUDIT_ACTIONS.UPDATE, 'orders', orderId, { status }, `Kitchen updated order status to ${status}`);
      return { data: true, error: null };
    } catch (err) {
      return { data: null, error: normalizeSupabaseError(err) };
    }
  },

  async getOrdersByStatus(status) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('status', status)
        .eq('is_deleted', false);
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeSupabaseError(err) };
    }
  },

  async getKitchenQueue() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, menu_items(name))')
        .in('status', [ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.PREPARING])
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeSupabaseError(err) };
    }
  }
};