import { supabase } from '@/lib/customSupabaseClient';

/**
 * Audits RLS policies for a specific table.
 */
export const auditTablePolicies = async (tableName) => {
  try {
    console.log(`[RLS Audit] Fetching policies for table: ${tableName}`);
    const { data, error } = await supabase.rpc('get_table_policies', { p_table_name: tableName });
    
    if (error) {
      console.error(`[RLS Audit] Error fetching policies:`, error);
      return { success: false, error: error.message, policies: [] };
    }

    const deletePolicies = data.filter(p => p.cmd === 'DELETE' || p.cmd === 'ALL');
    const hasDeletePolicy = deletePolicies.length > 0;

    return {
      success: true,
      tableName,
      totalPolicies: data.length,
      deletePolicies,
      hasDeletePolicy,
      allPolicies: data,
      warnings: !hasDeletePolicy ? ['Aucune politique DELETE trouvée. La suppression pourrait être bloquée.'] : []
    };
  } catch (err) {
    console.error(`[RLS Audit] Unexpected error:`, err);
    return { success: false, error: err.message, policies: [] };
  }
};