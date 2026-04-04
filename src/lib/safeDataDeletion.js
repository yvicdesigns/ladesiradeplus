import { supabase } from '@/lib/customSupabaseClient';
import { clearAllAppCache } from '@/lib/cacheUtils';
import { verifyDataReset } from '@/lib/verifyDataReset';

/**
 * Performs a safe data reset using a two-stage strategy:
 * 1. TRUNCATE CASCADE via secure RPC
 * 2. Fallback to client-side DELETEs if RPC partially fails
 */
export const performSafeDataReset = async (securityToken, onProgress = () => {}) => {
  const result = {
    success: false,
    totalDeleted: 0,
    tableResults: [],
    remainingTables: {},
    errors: [],
    completedAt: null
  };

  if (securityToken !== 'CONFIRM_PRODUCTION_WIPE') {
    result.errors.push({ message: 'Invalid security token. Deletion aborted.' });
    return result;
  }

  onProgress({ table: 'System', status: 'processing', message: 'Starting two-stage secure reset...' });

  try {
    // STAGE 1: Call secure RPC (attempts TRUNCATE CASCADE, then DELETE internally)
    onProgress({ table: 'RPC', status: 'processing', message: 'Executing core reset function...' });
    const { data: rpcData, error: rpcError } = await supabase.rpc('reset_all_data_secure');

    if (rpcError) throw rpcError;

    if (rpcData && rpcData.tableResults) {
      result.tableResults = rpcData.tableResults;
      result.totalDeleted = rpcData.total_deleted || 0;
      
      // Update UI with individual table results
      rpcData.tableResults.forEach(res => {
        onProgress({
          table: res.table,
          status: res.success ? 'success' : 'error',
          count: res.deleted || 0,
          error: res.error,
          message: res.message
        });
      });
    }

    // STAGE 2: Client-side Fallback Verification & Deletion
    onProgress({ table: 'Cache', status: 'processing', message: 'Clearing application cache...' });
    clearAllAppCache();
    onProgress({ table: 'Cache', status: 'success', message: 'Cache cleared.' });

    onProgress({ table: 'Verification', status: 'processing', message: 'Verifying tables are empty...' });
    const verification = await verifyDataReset();
    
    // If verification found data, try aggressive client-side fallback DELETE
    if (!verification.success && Object.keys(verification.tables_with_data).length > 0) {
      onProgress({ 
        table: 'Fallback', 
        status: 'processing', 
        message: `Attempting manual deletion on ${Object.keys(verification.tables_with_data).length} remaining tables...` 
      });

      for (const [tableName, count] of Object.entries(verification.tables_with_data)) {
        if (tableName === 'audit_logs') continue;
        
        try {
          const { error: delError } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (delError) throw delError;
          onProgress({ table: tableName, status: 'success', message: 'Cleared via fallback delete.', count });
          result.totalDeleted += count;
        } catch (e) {
          onProgress({ table: tableName, status: 'error', error: `Fallback failed: ${e.message}`, count });
          result.errors.push({ table: tableName, message: e.message });
        }
      }
    }

    // Final Verification
    const finalVerification = await verifyDataReset();
    result.remainingTables = finalVerification.tables_with_data;
    result.success = finalVerification.success;
    
    if (!finalVerification.success) {
      finalVerification.errors.forEach(err => result.errors.push({ message: err }));
      result.errors.push({ message: 'Reset completed with residual data. Manual intervention required.' });
    }

    onProgress({ 
      table: 'System', 
      status: result.success ? 'success' : 'warning', 
      message: result.success ? 'All data successfully wiped.' : 'Reset completed but some data remains.' 
    });

    result.completedAt = new Date().toISOString();
    return result;

  } catch (error) {
    console.error('Critical Reset Error:', error);
    onProgress({ table: 'System', status: 'error', error: error.message });
    result.errors.push({ message: `System Error: ${error.message}` });
    return result;
  }
};