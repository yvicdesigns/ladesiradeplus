import { supabase } from '@/lib/customSupabaseClient';
import { cleanAuditLogsSecure } from './resetTestData';

export const testAuditLogsCleanup = async () => {
  const report = {
    success: false,
    steps: [],
    errors: [],
    finalCounts: {}
  };

  try {
    // Étape 1: Créer un log d'audit factice
    report.steps.push("Création d'un enregistrement factice dans audit_logs...");
    const { error: insertError } = await supabase.from('audit_logs').insert([{
      action: 'TEST_INSERT',
      table_name: 'test_table',
      reason: 'Testing cleanup function'
    }]);

    if (insertError) throw new Error(`Échec de l'insertion: ${insertError.message}`);
    report.steps.push("Enregistrement factice créé avec succès.");

    // Étape 2: Vérifier le décompte avant
    const { count: countBefore } = await supabase.from('audit_logs').select('id', { count: 'exact', head: true });
    report.steps.push(`Décompte avant nettoyage: ${countBefore} lignes.`);

    // Étape 3: Exécuter le nettoyage
    report.steps.push("Exécution de la fonction clean_audit_logs_safe()...");
    const result = await cleanAuditLogsSecure();
    
    if (!result.success) throw new Error(`Échec de la fonction: ${result.message}`);
    report.steps.push(`Nettoyage réussi.`);

    // Étape 4: Vérifier le décompte après
    const { count: countAfter } = await supabase.from('audit_logs').select('id', { count: 'exact', head: true });
    report.finalCounts.audit_logs = countAfter;
    
    // Il devrait rester 1 ligne (le log de l'action de nettoyage elle-même)
    if (countAfter <= 1) {
        report.steps.push(`Vérification finale réussie: ${countAfter} lignes restantes (Trace de purge).`);
        report.success = true;
    } else {
        report.steps.push(`Avertissement: ${countAfter} lignes restantes, le nettoyage n'a pas été total.`);
    }

  } catch (err) {
    report.errors.push(err.message);
    report.steps.push(`Test interrompu suite à une erreur: ${err.message}`);
  }

  return report;
};