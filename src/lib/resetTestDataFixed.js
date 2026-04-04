import { supabase } from '@/lib/customSupabaseClient';

/**
 * FIXED DELETION SEQUENCE
 * Respects all foreign key constraints by deleting children before parents.
 * Sequence explicitly requested: order_items -> delivery_orders -> restaurant_orders -> 
 * delivery_tracking -> orders -> customers -> audit_logs -> activity_logs
 */
export const SAFE_DELETION_ORDER = [
  // 1. Auxiliary & independent tables
  'user_notifications',
  'item_stock_movements',
  'payments',
  'refunds',
  'customer_orders',
  'customer_reservations',
  'reservations',
  'reviews',
  'analytics_cache',
  'reports',
  
  // 2. The critical requested sequence (Children to Parents)
  'order_items',
  'delivery_orders',
  'restaurant_orders',
  'delivery_tracking',
  'orders',
  'customers',
  'activity_logs', // System tables at the end
  'audit_logs'
];

/**
 * Executes the safe deletion sequence with comprehensive error handling
 */
export const executeSafeReset = async (onProgress = () => {}) => {
  const results = {
    success: true,
    completedAt: null,
    totalDeleted: 0,
    tableResults: [],
    errors: []
  };

  for (const table of SAFE_DELETION_ORDER) {
    onProgress({ table, status: 'processing', count: 0 });
    
    try {
      // 1. Count records before deletion
      const { count: countBefore, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .not('id', 'is', null);

      if (countError) {
        if (countError.code === '42P01') {
           onProgress({ table, status: 'skipped', message: 'Table inexistante' });
           results.tableResults.push({ table, deleted: 0, success: true, message: 'Table inexistante' });
           continue;
        }
        throw countError;
      }

      if (countBefore === 0) {
         onProgress({ table, status: 'success', count: 0, message: 'Déjà vide' });
         results.tableResults.push({ table, deleted: 0, success: true });
         continue;
      }

      // 2. Perform deletion
      let deleteError = null;
      let deletedCount = 0;

      // For audit logs, use the safe RPC if standard delete fails
      if (table === 'audit_logs' || table === 'activity_logs') {
          const rpcRes = await supabase.rpc('clean_audit_logs_safe');
          if (rpcRes.error) deleteError = rpcRes.error;
          deletedCount = countBefore;
      } else {
          const res = await supabase
            .from(table)
            .delete()
            .not('id', 'is', null);
            
          deleteError = res.error;
          deletedCount = countBefore;
      }

      // 3. Handle deletion errors
      if (deleteError) {
        throw deleteError;
      }

      results.totalDeleted += deletedCount;
      onProgress({ table, status: 'success', count: deletedCount });
      results.tableResults.push({ table, deleted: deletedCount, success: true });

    } catch (error) {
      console.error(`[Reset] Erreur sur la table ${table}:`, error);
      
      // Parse FK violation explicitly
      let errorDetail = error.message;
      let suggestion = "Vérifiez les permissions de la table.";
      
      if (error.code === '23503') {
          errorDetail = `Violation de clé étrangère: ${error.details || error.message}`;
          suggestion = `La table '${table}' a des enregistrements enfants qui l'empêchent d'être supprimée. Vérifiez l'ordre de suppression.`;
      }

      const formattedError = {
          table,
          code: error.code || 'UNKNOWN',
          message: error.message,
          detail: errorDetail,
          hint: error.hint || 'Aucun indice fourni par la base de données',
          suggestion
      };

      onProgress({ table, status: 'error', error: errorDetail });
      results.tableResults.push({ table, deleted: 0, success: false, error: formattedError });
      results.errors.push(formattedError);
      results.success = false;
      
      // If a critical sequence table fails, we might want to halt, but we'll try to continue to clean what we can.
    }
  }

  results.completedAt = new Date().toISOString();
  return results;
};