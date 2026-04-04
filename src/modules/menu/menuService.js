import { supabase } from '@/lib/customSupabaseClient';
import { normalizeSupabaseError } from '@/lib/errorHandler';
import { logAudit } from '@/lib/auditLogUtils';
import { AUDIT_ACTIONS } from '@/constants/AUDIT_ACTIONS';

export const menuService = {
  async getMenuItems(restaurantId) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, menu_categories(name)')
        .eq('is_deleted', false)
        .eq('restaurant_id', restaurantId);
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeSupabaseError(err) };
    }
  },

  async getCategories(restaurantId) {
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('is_deleted', false)
        .eq('restaurant_id', restaurantId)
        .order('display_order');
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeSupabaseError(err) };
    }
  },

  async getItemById(id) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeSupabaseError(err) };
    }
  },

  async updateItemAvailability(id, isAvailable) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .update({ is_available: isAvailable })
        .eq('id', id)
        .select();
      if (error) throw error;
      
      await logAudit(AUDIT_ACTIONS.UPDATE, 'menu_items', id, { is_available: isAvailable }, `Availability changed to ${isAvailable}`);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeSupabaseError(err) };
    }
  },

  async getItemStock(id) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('stock_quantity')
        .eq('id', id)
        .single();
      if (error) throw error;
      return { data: data.stock_quantity, error: null };
    } catch (err) {
      return { data: null, error: normalizeSupabaseError(err) };
    }
  }
};