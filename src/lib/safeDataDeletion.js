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
    // STAGE 1: Try RPC (optional — falls through if function doesn't exist)
    onProgress({ table: 'RPC', status: 'processing', message: 'Tentative via fonction sécurisée...' });
    const { data: rpcData, error: rpcError } = await supabase.rpc('reset_all_data_secure');

    if (!rpcError && rpcData?.tableResults) {
      result.tableResults = rpcData.tableResults;
      result.totalDeleted = rpcData.total_deleted || 0;
      rpcData.tableResults.forEach(res => {
        onProgress({ table: res.table, status: res.success ? 'success' : 'error', count: res.deleted || 0 });
      });
    } else {
      // RPC unavailable — proceed with direct client-side deletion
      onProgress({ table: 'RPC', status: 'warning', message: 'Fonction RPC indisponible, suppression directe...' });

      const DELETION_ORDER = [
        'user_notifications', 'item_stock_movements', 'payments', 'refunds',
        'customer_orders', 'customer_reservations', 'reservations', 'reviews',
        'analytics_cache', 'reports',
        'order_items', 'delivery_orders', 'restaurant_orders', 'delivery_tracking',
        'orders', 'customers', 'activity_logs', 'audit_logs'
      ];

      for (const table of DELETION_ORDER) {
        onProgress({ table, status: 'processing' });
        try {
          const { error: delError } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (delError && delError.code !== '42P01') throw delError;
          onProgress({ table, status: 'success' });
          result.totalDeleted++;
        } catch (e) {
          onProgress({ table, status: 'error', error: e.message });
          result.errors.push({ table, message: e.message });
        }
      }
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