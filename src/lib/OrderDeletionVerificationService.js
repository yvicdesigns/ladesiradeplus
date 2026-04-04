import { supabase } from '@/lib/customSupabaseClient';

export const OrderDeletionVerificationService = {
  async verifyOrderDeleted(orderId) {
    const { data, error } = await supabase.from('orders').select('id').eq('id', orderId);
    if (error) return { status: 'error', details: error.message };
    return { status: data.length === 0 ? 'success' : 'failed', details: data.length === 0 ? 'Order deleted' : 'Order still exists' };
  },

  async verifyOrderItemsHandled(orderId) {
    const { data, error } = await supabase.from('order_items').select('id').eq('order_id', orderId);
    if (error) return { status: 'error', details: error.message };
    return { status: data.length === 0 ? 'success' : 'failed', details: data.length === 0 ? 'Items deleted' : `${data.length} items remain` };
  },

  async verifyPaymentRecords(orderId) {
    const { data, error } = await supabase.from('payments').select('id, status').eq('order_id', orderId);
    if (error) return { status: 'error', details: error.message };
    // Depending on logic, payments might be kept or deleted. Assuming deletion for cascade test.
    return { status: data.length === 0 ? 'success' : 'warning', details: data.length === 0 ? 'Payments deleted' : 'Payments orphaned/kept' };
  },

  async verifyDeliveryOrdersHandled(orderId) {
    const { data, error } = await supabase.from('delivery_orders').select('id').eq('order_id', orderId);
    if (error) return { status: 'error', details: error.message };
    return { status: data.length === 0 ? 'success' : 'failed', details: data.length === 0 ? 'Delivery order deleted' : 'Delivery order remains' };
  },

  async verifyRestaurantOrdersHandled(orderId) {
    const { data, error } = await supabase.from('restaurant_orders').select('id').eq('order_id', orderId);
    if (error) return { status: 'error', details: error.message };
    return { status: data.length === 0 ? 'success' : 'failed', details: data.length === 0 ? 'Restaurant order deleted' : 'Restaurant order remains' };
  },

  async runFullVerification(orderId) {
    const results = {
      order: await this.verifyOrderDeleted(orderId),
      items: await this.verifyOrderItemsHandled(orderId),
      payments: await this.verifyPaymentRecords(orderId),
      delivery: await this.verifyDeliveryOrdersHandled(orderId),
      restaurant: await this.verifyRestaurantOrdersHandled(orderId)
    };
    
    const allPassed = Object.values(results).every(r => r.status === 'success' || r.status === 'warning');
    return { success: allPassed, details: results };
  }
};