import { supabase } from '@/lib/customSupabaseClient';

/**
 * Diagnostics Tools for Data Reset operations.
 * Checks for FK issues, blocking records, and configuration prior to running the reset.
 */
export const checkPreResetDiagnostics = async () => {
  const diagnosticReport = {
    success: true,
    warnings: [],
    fkIssues: [],
    orphanedRecords: [],
    tableCounts: {},
    recommendations: []
  };

  try {
    // 1. Check constraints via RPC (if available)
    const { data: fkData, error: fkError } = await supabase.rpc('audit_foreign_keys');
    if (!fkError && fkData) {
      const missingCascade = fkData.filter(fk => fk.status !== 'OK' && fk.delete_rule !== 'CASCADE');
      
      if (missingCascade.length > 0) {
        diagnosticReport.success = false;
        diagnosticReport.warnings.push(`${missingCascade.length} clés étrangères n'ont pas la règle ON DELETE CASCADE.`);
        diagnosticReport.fkIssues = missingCascade;
        diagnosticReport.recommendations.push("Utilisez l'ordre de suppression strict car certaines tables bloqueront la suppression parentale.");
      }
    }

    // 2. Fast check of current data volumes in critical path tables
    const criticalTables = ['customers', 'orders', 'delivery_orders', 'order_items', 'restaurant_orders'];
    for (const table of criticalTables) {
      const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
      if (!error) {
        diagnosticReport.tableCounts[table] = count || 0;
      }
    }

    // 3. Detect orphaned blocking records (Example: order_items without orders)
    // This uses raw checking if possible, though strict FKs usually prevent orphans.
    const { data: orphanedItems } = await supabase
      .from('order_items')
      .select('id, order_id')
      .limit(10);
      
    if (orphanedItems && orphanedItems.length > 0) {
        // Quick verification if their parent orders exist
        const orderIds = [...new Set(orphanedItems.map(i => i.order_id))];
        const { data: parentOrders } = await supabase.from('orders').select('id').in('id', orderIds);
        
        const existingParentIds = parentOrders ? parentOrders.map(o => o.id) : [];
        const actualOrphans = orphanedItems.filter(i => !existingParentIds.includes(i.order_id));
        
        if (actualOrphans.length > 0) {
            diagnosticReport.orphanedRecords.push({
                table: 'order_items',
                count: actualOrphans.length,
                description: 'Éléments de commande sans commande parente valide.'
            });
            diagnosticReport.recommendations.push("Certaines tables contiennent des données orphelines. Un nettoyage en cascade est recommandé.");
        }
    }

    // Overall Success Logic
    if (diagnosticReport.warnings.length > 0 || diagnosticReport.fkIssues.length > 0) {
       diagnosticReport.success = false;
    }

    return diagnosticReport;
  } catch (err) {
    console.error('Pre-reset diagnostic failed:', err);
    return {
      success: false,
      warnings: ['Le diagnostic pré-réinitialisation a échoué.'],
      fkIssues: [],
      orphanedRecords: [],
      tableCounts: {},
      recommendations: ["Exécutez la réinitialisation avec prudence."],
      error: err.message
    };
  }
};