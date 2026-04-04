import { supabase } from '@/lib/customSupabaseClient';
import { AUDIT_ACTIONS } from '@/constants/AUDIT_ACTIONS';

/**
 * Core utility for creating immutable audit logs.
 * Captures user context, action, and record data for compliance.
 * Updated to use a SECURITY DEFINER RPC to bypass RLS restrictions (Error 42501).
 * 
 * @param {string} action - Value from AUDIT_ACTIONS
 * @param {string} tableName - The table being modified
 * @param {string} [recordId=null] - The UUID of the record being modified
 * @param {Object} [oldData={}] - The full JSON representation of the record before modification
 * @param {string} [reason=null] - Optional reason provided by the user
 * @returns {Promise<Object>} The inserted audit log or error
 */
export const logAudit = async (action, tableName, recordId = null, oldData = {}, reason = null) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.warn('[AuditLog] Warning: Could not retrieve user for audit log. Proceeding as system operation.', userError.message);
    }

    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
    const userId = user?.id || null;

    // Validate action against allowed constants, default to UPDATE if invalid
    const validAction = Object.values(AUDIT_ACTIONS).includes(action) ? action : AUDIT_ACTIONS.UPDATE;

    if (!tableName) {
      console.warn('[AuditLog] Warning: tableName is required for audit logging.');
      return { success: false, error: new Error('tableName is required') };
    }

    // Try using the secure RPC first (Bypasses RLS)
    const { data: rpcData, error: rpcError } = await supabase.rpc('log_audit_safe', {
      p_action: validAction,
      p_table_name: tableName,
      p_record_id: recordId,
      p_old_data: oldData || {},
      p_reason: reason,
      p_user_id: userId,
      p_user_agent: userAgent
    });

    if (rpcError) {
      console.error('[AuditLog] RPC log_audit_safe failed:', rpcError.message);
      
      // Fallback: Try direct insert if RPC fails for some reason
      console.log('[AuditLog] Attempting fallback direct insert...');
      const logEntry = {
        user_id: userId,
        action: validAction,
        table_name: tableName,
        record_id: recordId,
        old_data: oldData || {},
        reason: reason,
        user_agent: userAgent
      };

      const { data: insertData, error: insertError } = await supabase
        .from('audit_logs')
        .insert([logEntry])
        .select()
        .single();

      if (insertError) {
        console.error('[AuditLog] Fallback direct insert also failed. RLS issue likely persists:', insertError.message);
        // We do not throw the error here to ensure the main application flow is NOT interrupted
        return { success: false, error: insertError };
      }

      return { success: true, data: insertData, fallbackUsed: true };
    }

    // Check if the RPC executed but returned a logical error internally
    if (rpcData && rpcData.success === false) {
      console.error('[AuditLog] RPC returned logical error:', rpcData.error);
      return { success: false, error: new Error(rpcData.error) };
    }

    return { success: true, data: rpcData };
  } catch (err) {
    // Catch-all to prevent audit logging from breaking main business logic
    console.error('[AuditLog] Critical unexpected error during audit logging:', err);
    return { success: false, error: err };
  }
};