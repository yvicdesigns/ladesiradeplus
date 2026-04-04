import { supabase } from '@/lib/customSupabaseClient';
import { normalizeSupabaseError } from '@/lib/errorHandler';
import { logAudit } from '@/lib/auditLogUtils';
import { AUDIT_ACTIONS } from '@/constants/AUDIT_ACTIONS';

export const StockService = {
  async updateStock(menuItemId, quantityChange, orderId = null, notes = '') {
    try {
      const { data, error } = await supabase.rpc('handle_order_stock'); 
      if (error) throw error;
      
      await logAudit(AUDIT_ACTIONS.UPDATE, 'menu_items', menuItemId, { quantity_change: quantityChange }, notes || 'Stock update via StockService');
      
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: normalizeSupabaseError(err) };
    }
  },

  async getStockLevel(menuItemId) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('stock_quantity')
        .eq('id', menuItemId)
        .single();
      if (error) throw error;
      return { stock: data.stock_quantity, error: null };
    } catch (err) {
      return { stock: 0, error: normalizeSupabaseError(err) };
    }
  },

  async validateStockAvailability(items) {
    for (const item of items) {
      const { stock } = await this.getStockLevel(item.menu_item_id);
      if (stock < item.quantity) {
        return { isValid: false, failedItem: item.menu_item_id };
      }
    }
    return { isValid: true };
  }
};