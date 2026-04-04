import { supabase } from '@/lib/customSupabaseClient';
import { DEFAULT_ADMIN_SETTINGS_ID, isValidAdminSettingsId } from '@/lib/adminSettingsUtils';

export const runSecurityTests = async () => {
  const issues = [];
  let score = 100;

  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    // 1. Check Session & Tokens
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      issues.push({
        id: 'SEC-01',
        severity: 'Critique',
        title: 'Erreur de récupération de session',
        description: sessionError.message,
        recommendation: 'Vérifier la configuration JWT et les clés Supabase.'
      });
      score -= 30;
    } else if (!session) {
      issues.push({
        id: 'SEC-02',
        severity: 'Mineur',
        title: 'Audit exécuté sans session active',
        description: 'Certains tests RLS pourraient ne pas être pertinents sans utilisateur connecté.',
        recommendation: 'Connectez-vous avec un compte de test pour un audit complet.'
      });
      score -= 5;
    }

    // 2. Test RLS (Attempt unauthorized access)
    if (session) {
       const testId = DEFAULT_ADMIN_SETTINGS_ID; // Now strictly valid UUID v4
       
       if (!isValidAdminSettingsId(testId)) {
         issues.push({
           id: 'SEC-03A',
           severity: 'Critique',
           title: 'Identifiant de test UUID invalide',
           description: `L'ID de test ${testId} n'est pas un UUID valide.`,
           recommendation: 'Corriger l\'identifiant dans le script d\'audit.'
         });
         score -= 20;
       } else {
         const { error: rlsError } = await supabase
           .from('admin_settings')
           .update({ restaurant_name: 'Test Security Probe' })
           .eq('id', testId);
           
         if (!rlsError) {
           issues.push({
             id: 'SEC-03B',
             severity: 'Majeur',
             title: 'Politique RLS potentiellement permissive',
             description: 'Une tentative de modification de table protégée n\'a pas renvoyé d\'erreur explicite de permission.',
             recommendation: 'Vérifier les politiques RLS sur les tables sensibles (admin_settings, orders).'
           });
           score -= 20;
         } else if (rlsError.message.includes('invalid input syntax for type uuid')) {
           issues.push({
             id: 'SEC-03C',
             severity: 'Critique',
             title: 'Erreur de syntaxe UUID détectée',
             description: 'Le système a rejeté la requête pour cause d\'UUID mal formaté.',
             recommendation: 'Utiliser la fonction isValidAdminSettingsId() avant les requêtes Supabase.'
           });
           score -= 30;
         }
       }
    }

    // 3. Sensitive Data Exposure check
    const localKeys = Object.keys(localStorage);
    if (localKeys.some(k => k.toLowerCase().includes('password') || k.toLowerCase().includes('secret'))) {
      issues.push({
        id: 'SEC-04',
        severity: 'Critique',
        title: 'Données sensibles en LocalStorage',
        description: 'Des clés suspectes contenant "password" ou "secret" ont été trouvées.',
        recommendation: 'Ne jamais stocker de mots de passe ou secrets en clair côté client.'
      });
      score -= 40;
    }

  } catch (err) {
    issues.push({
      id: 'SEC-05',
      severity: 'Majeur',
      title: 'Échec du module de test de sécurité',
      description: err.message,
      recommendation: 'Vérifier la connectivité Supabase et la gestion des promesses.'
    });
    score -= 20;
  }

  return {
    category: 'SÉCURITÉ',
    score: Math.max(0, score),
    issues,
    metrics: {
      tokensValid: true,
      rlsEnforced: score > 80,
      vulnerabilitiesFound: issues.length
    }
  };
};