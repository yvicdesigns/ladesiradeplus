import { supabase } from '@/lib/customSupabaseClient';

export const simpleDeleteDeliveryOrder = async (orderId) => {
  console.log(`🗑️ [SOFT DELETE] orders: ${orderId}`);
  try {
    const { error, data } = await supabase.from('orders').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', orderId).select();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const simpleDeleteDeliveryOrdersMultiple = async (orderIds) => {
  try {
    const { error, data } = await supabase.from('orders').update({ is_deleted: true, deleted_at: new Date().toISOString() }).in('id', orderIds).select();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const restoreDeliveryOrder = async (orderId) => {
  try {
    const { error, data } = await supabase.from('orders').update({ is_deleted: false, deleted_at: null }).eq('id', orderId).select();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const restoreDeliveryOrdersMultiple = async (orderIds) => {
  try {
    const { error, data } = await supabase.from('orders').update({ is_deleted: false, deleted_at: null }).in('id', orderIds).select();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};