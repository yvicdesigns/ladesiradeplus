import { supabase } from '@/lib/customSupabaseClient';
import { normalizeSupabaseError } from '@/lib/errorHandler';
import { logAudit } from '@/lib/auditLogUtils';
import { AUDIT_ACTIONS } from '@/constants/AUDIT_ACTIONS';

export const authService = {
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      if (data?.user) {
        await logAudit(AUDIT_ACTIONS.LOGIN, 'users', data.user.id, null, 'User login');
      }
      
      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeSupabaseError(err) };
    }
  },

  async logout() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         await logAudit(AUDIT_ACTIONS.LOGOUT, 'users', user.id, null, 'User logout');
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: normalizeSupabaseError(err) };
    }
  },

  async signup(email, password, metadata = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: metadata }
      });
      if (error) throw error;
      
      if (data?.user) {
         await logAudit(AUDIT_ACTIONS.INSERT, 'users', data.user.id, data.user, 'User signup');
      }
      
      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeSupabaseError(err) };
    }
  },

  async getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  },

  async getUserRole(userId) {
    if (!userId) return null;
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
    return data?.role;
  },

  async validateAdminAccess(userId) {
    const role = await this.getUserRole(userId);
    return ['admin', 'manager'].includes(role);
  },

  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    return { data, error };
  }
};