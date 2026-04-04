import { supabase } from '@/lib/customSupabaseClient';
import { deletionLogger } from './deletionLogger';

/**
 * Soft deletes an order from the 'orders' table.
 */
export const simpleDeleteOrder = async (orderId) => {
  deletionLogger.addLog('INFO', `===========================================`);
  deletionLogger.logDeleteClick('orders', orderId);
  
  try {
    deletionLogger.logDeleteQuery('orders', orderId, `UPDATE orders SET is_deleted = true WHERE id = '${orderId}'`);
    const { error: orderError, data: orderData } = await supabase
      .from('orders')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', orderId)
      .select();

    deletionLogger.logSupabaseResponse('orders', { error: orderError, data: orderData });

    if (orderError) {
      deletionLogger.logDeleteError('orders', orderId, orderError);
      return { success: false, error: orderError.message, data: null };
    }

    if (!orderData || orderData.length === 0) {
      deletionLogger.addLog('WARN', `Order not found or RLS blocked update silently.`, { orderId });
      return { success: false, error: "La mise à la corbeille a échoué (Problème RLS ou commande introuvable).", data: null };
    }

    deletionLogger.logDeleteSuccess('orders', orderId, orderData.length);
    deletionLogger.addLog('INFO', `===========================================\n`);
    
    return { success: true, error: null, data: orderData[0], verifiedDeleted: true };
    
  } catch (err) {
    deletionLogger.logDeleteError('orders', orderId, err);
    deletionLogger.addLog('INFO', `===========================================\n`);
    return { success: false, error: err.message, data: null, verifiedDeleted: false };
  }
};

/**
 * Restores a soft-deleted order.
 */
export const restoreOrder = async (orderId) => {
  try {
    const { error, data } = await supabase
      .from('orders')
      .update({ is_deleted: false, deleted_at: null })
      .eq('id', orderId)
      .select();
      
    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
};