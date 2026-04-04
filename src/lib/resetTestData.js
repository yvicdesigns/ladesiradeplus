import { runPreResetDiagnostics, TABLES_TO_RESET } from './resetDiagnostics';
import { performSafeDataReset } from './safeDataDeletion';
import { verifyDataReset } from './verifyDataReset';

export { TABLES_TO_RESET };

/**
 * Runs pre-reset diagnostics to check database health and permissions.
 */
export const runResetDiagnostics = async () => {
  return await runPreResetDiagnostics();
};

/**
 * Verifies if the reset was complete by checking row counts on critical tables.
 */
export const verifyResetCompletion = async () => {
  return await verifyDataReset();
};

/**
 * Executes the full production reset flow.
 */
export const executeProductionReset = async (securityToken, onProgress = () => {}) => {
  return await performSafeDataReset(securityToken, onProgress);
};

/**
 * Runs advanced diagnostics via database RPC.
 */
export const runAdvancedDiagnostics = async () => {
  const { supabase } = await import('@/lib/customSupabaseClient');
  try {
    const { data, error } = await supabase.rpc('diagnose_reset_issues');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Advanced diagnostic error:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Cleans audit logs securely via database RPC.
 */
export const cleanAuditLogsSecure = async () => {
  const { supabase } = await import('@/lib/customSupabaseClient');
  try {
    const { data, error } = await supabase.rpc('clean_audit_logs_safe');
    if (error) throw error;
    return data || { success: true };
  } catch (error) {
    console.error("Audit log cleanup error:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Force deletes remaining data from specific tables that didn't clear during standard reset.
 * This is used as a manual "clean-up" button in the UI.
 */
export const forceDeleteRemainingData = async (tables) => {
  const { supabase } = await import('@/lib/customSupabaseClient');
  const results = { success: true, errors: [] };
  
  console.log('[Force Delete] Attempting manual deletion on:', tables);
  
  for (const t of tables) {
    try {
      // We use a dummy condition to trigger a bulk delete via PostgREST
      const { error } = await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      console.log(`[Force Delete] Successfully cleared ${t}`);
    } catch (err) {
      console.error(`[Force Delete] Failed on ${t}:`, err);
      results.success = false;
      results.errors.push(`Échec suppression forcée ${t}: ${err.message}`);
    }
  }
  
  return results;
};