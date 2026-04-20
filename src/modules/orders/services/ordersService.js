import { supabase } from '@/lib/customSupabaseClient';
import { ORDER_ERRORS, OrderError } from '../constants/errors';

export const ordersService = {
  async fetchUserOrders(userId, filters = {}) {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*, menu_items(name, image_url)),
          delivery_orders (*)
        `, { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
      if (filters.type && filters.type !== 'all') query = query.eq('type', filters.type);
      if (filters.limit) query = query.limit(filters.limit);
      
      const { data, error, count } = await query;
      if (error) throw error;
      
      return { orders: data, count };
    } catch (err) {
      console.error('fetchUserOrders Error:', err);
      throw new OrderError(ORDER_ERRORS.NOT_FOUND, err);
    }
  },

  async fetchOrderById(orderId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*, menu_items(*)),
          delivery_orders (*),
          restaurant_orders (*)
        `)
        .eq('id', orderId)
        .single();
        
      if (error) throw error;
      if (!data) throw new Error('Not found');
      
      return data;
    } catch (err) {
      throw new OrderError(ORDER_ERRORS.NOT_FOUND, err);
    }
  },

  async fetchAdminOrders(filters = {}, pagination = { page: 1, limit: 50 }) {
    try {
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;

      let query = supabase
        .from('orders')
        .select(`*, order_items (id, quantity, price)`, { count: 'exact' })
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
      if (filters.search) query = query.or(`id.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%`);

      const { data, error, count } = await query;
      if (error) throw error;

      return { orders: data, count };
    } catch (err) {
      console.error('fetchAdminOrders Error:', err);
      throw new OrderError(ORDER_ERRORS.NOT_FOUND, err);
    }
  },

  async fetchDeliveryOrders(status) {
    try {
      let query = supabase
        .from('delivery_orders')
        .select(`*, orders(*)`)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') query = query.eq('status', status);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (err) {
      throw new OrderError(ORDER_ERRORS.NOT_FOUND, err);
    }
  },

  async createOrderAtomic(orderData) {
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
        p_discount_breakdown: null,
        p_promo_code_id: null,
        p_delivery_data: orderData.delivery_data || null,
        p_restaurant_data: orderData.restaurant_data || null
      });

      if (error) throw error;
      if (!data || !data.success) throw new Error(data?.message || 'Creation failed');
      
      return data.order_id;
    } catch (err) {
      console.error('createOrderAtomic Error:', err);
      throw new OrderError(ORDER_ERRORS.CREATION_FAILED, err);
    }
  },

  async updateOrderStatus(orderId, newStatus) {
    try {
      const { data, error } = await supabase.rpc('update_delivery_order_status', {
        p_order_id: orderId,
        p_new_status: newStatus
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.message);
      
      return data;
    } catch (err) {
      console.error('updateOrderStatus Error:', err);
      throw new OrderError(ORDER_ERRORS.UPDATE_FAILED, err);
    }
  },

  async cancelOrder(orderId, reason) {
    try {
      // Update orders table (client-facing status)
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
      if (orderError) throw orderError;

      // Update delivery_orders table (admin-facing status)
      const { error: deliveryError } = await supabase
        .from('delivery_orders')
        .update({ status: 'cancelled' })
        .eq('order_id', orderId);
      if (deliveryError) throw deliveryError;

      return { success: true, message: 'Order cancelled successfully' };
    } catch (err) {
      console.error('cancelOrder Error:', err);
      throw new OrderError(ORDER_ERRORS.CANCEL_REJECTED, err);
    }
  }
};