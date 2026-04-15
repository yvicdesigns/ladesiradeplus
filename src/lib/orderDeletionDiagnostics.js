import { supabase } from '@/lib/customSupabaseClient';
import { auditTablePolicies } from './rlsPolicyAudit';
import { checkTableReferences } from './foreignKeyChecker';

export const runFullOrderDeletionDiagnostic = async () => {
  const report = {
    timestamp: new Date().toISOString(),
    connection: { status: 'pending', details: null },
    auth: { status: 'pending', user: null, role: null },
    tableOrders: { exists: false, rlsEnabled: false },
    policies: null,
    foreignKeys: null,
    testDelete: { status: 'pending', error: null },
    overallHealth: 'pending'
  };

  try {
    // 1. Check Connection & Auth
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) throw new Error(`Erreur Auth: ${authError.message}`);
    
    report.connection.status = 'ok';
    report.auth.status = session ? 'authenticated' : 'unauthenticated';
    report.auth.user = session?.user?.id;

    if (session?.user?.id) {
       const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', session.user.id).maybeSingle();
       report.auth.role = profile?.role || 'unknown';
    }

    // 2. Check Table and RLS
    const policiesReport = await auditTablePolicies('orders');
    report.policies = policiesReport;
    report.tableOrders.exists = policiesReport.success;

    // 3. Check Foreign Keys
    const fkReport = await checkTableReferences('orders');
    report.foreignKeys = fkReport;

    // 4. Determine overall health
    const issues = [];
    if (!session) issues.push("Utilisateur non authentifié.");
    if (report.auth.role !== 'admin') issues.push(`Rôle actuel (${report.auth.role}) pourrait ne pas avoir les droits de suppression.`);
    if (policiesReport.warnings?.length > 0) issues.push(...policiesReport.warnings);
    if (fkReport.warnings?.length > 0) issues.push(...fkReport.warnings);

    report.overallHealth = issues.length > 0 ? 'warning' : 'healthy';
    report.issues = issues;

    return { success: true, report };

  } catch (error) {
    report.overallHealth = 'error';
    report.connection.status = 'error';
    report.connection.details = error.message;
    return { success: false, error: error.message, report };
  }
};

export const testSafeDelete = async (orderId) => {
  console.log(`[Diagnostic] Starting safe test delete for order ID: ${orderId}`);
  
  // We will attempt a dry-run or full fetch to verify it exists first
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .single();

  if (fetchError) {
    return { success: false, step: 'fetch', error: fetchError };
  }

  // Attempt delete inside a transaction? Supabase doesn't support true client-side transactions.
  // We will just log the exact query string that *would* be executed.
  const queryString = `DELETE FROM orders WHERE id = '${orderId}';`;
  console.log(`[Diagnostic] Query to execute: ${queryString}`);
  
  return { 
    success: true, 
    message: "Le test sécurisé a validé que la commande existe. La suppression nécessitera l'exécution de la requête.", 
    order,
    queryString
  };
};