import { supabase } from '@/lib/customSupabaseClient';
import { logAudit } from './auditLogUtils';

/**
 * Service layer for managing and retrieving audit logs.
 */
export const auditLogService = {
  /**
   * Logs a soft delete action.
   */
  async logDeletion(tableName, recordId, oldData, reason = null) {
    return await logAudit('DELETE', tableName, recordId, oldData, reason);
  },

  /**
   * Logs a record restoration.
   */
  async logRestore(tableName, recordId, reason = null) {
    return await logAudit('RESTORE', tableName, recordId, null, reason);
  },

  /**
   * Logs an update action.
   */
  async logUpdate(tableName, recordId, oldData, newData, reason = null) {
    // Optional: We could compute a diff here to save space, but oldData provides a full snapshot
    return await logAudit('UPDATE', tableName, recordId, oldData, reason);
  },

  /**
   * Retrieves audit logs with optional filters.
   * @param {Object} filters - { userId, tableName, action, startDate, endDate }
   */
  async getAuditLogs(filters = {}) {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          users:user_id (email)
        `)
        .order('created_at', { ascending: false });

      if (filters.userId) query = query.eq('user_id', filters.userId);
      if (filters.tableName && filters.tableName !== 'all') query = query.eq('table_name', filters.tableName);
      if (filters.action && filters.action !== 'all') query = query.eq('action', filters.action);
      if (filters.startDate) query = query.gte('created_at', filters.startDate);
      if (filters.endDate) query = query.lte('created_at', filters.endDate);

      const { data, error } = await query;
      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('[AuditLogService] Error fetching logs:', error);
      return { success: false, error, data: [] };
    }
  },

  /**
   * Retrieves the audit history for a specific record.
   */
  async getRecordAuditHistory(tableName, recordId) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          users:user_id (email)
        `)
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error(`[AuditLogService] Error fetching history for ${tableName}:${recordId}:`, error);
      return { success: false, error, data: [] };
    }
  }
};