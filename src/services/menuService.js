import { supabase } from '@/lib/customSupabaseClient';
import { applyIsDeletedFilter } from '@/lib/softDeleteUtils';
import { logAudit } from '@/lib/auditLogUtils';
import { AUDIT_ACTIONS } from '@/constants/AUDIT_ACTIONS';

export const menuService = {
  async getActiveMenuItems() {
    try {
      let query = supabase
        .from('menu_items')
        .select(`
          *,
          category:menu_categories(id, name)
        `)
        .eq('is_available', true)
        .order('name');
        
      query = applyIsDeletedFilter(query, false);
        
      const { data, error } = await query;
        
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MenuService] Error fetching items:', error);
      return { data: null, error };
    }
  },

  async getCategories() {
    try {
      let query = supabase
        .from('menu_categories')
        .select('*')
        .order('display_order');
        
      query = applyIsDeletedFilter(query, false);
        
      const { data, error } = await query;
        
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[MenuService] Error fetching categories:', error);
      return { data: null, error };
    }
  }
};