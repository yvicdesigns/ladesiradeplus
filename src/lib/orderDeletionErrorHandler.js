/**
 * Categorizes and formats Supabase errors during order deletion.
 */
export const categorizeDeletionError = (error) => {
  if (!error) return { type: 'unknown', message: 'Erreur inconnue', details: 'Aucun détail fourni.' };

  const code = error.code || '';
  const message = (error.message || '').toLowerCase();

  // Foreign Key Violation
  if (code === '23503' || message.includes('foreign key constraint')) {
    return {
      type: 'fk_constraint',
      title: 'Violation de clé étrangère',
      message: 'Impossible de supprimer cette commande car elle est référencée par d\'autres éléments.',
      suggestion: 'Vérifiez les éléments liés (ex: livraisons, paiements, avis) et supprimez-les en premier, ou activez la suppression en cascade (CASCADE DELETE).',
      details: error.message,
      originalError: error
    };
  }

  // Row Level Security / Permission
  if (code === '42501' || message.includes('rls') || message.includes('policy')) {
    return {
      type: 'rls_policy',
      title: 'Erreur de Permissions (RLS)',
      message: 'Vous n\'avez pas les droits nécessaires pour supprimer cette commande.',
      suggestion: 'Vérifiez les politiques RLS (Row Level Security) sur la table "orders" pour le rôle actuel.',
      details: error.message,
      originalError: error
    };
  }

  // Network / Timeout
  if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
    return {
      type: 'network',
      title: 'Erreur Réseau',
      message: 'La requête a échoué en raison d\'un problème réseau ou d\'un délai d\'attente dépassé.',
      suggestion: 'Vérifiez votre connexion internet et l\'état du serveur Supabase.',
      details: error.message,
      originalError: error
    };
  }

  // Not Found
  if (code === 'PGRST116' || message.includes('not found') || message.includes('0 rows')) {
     return {
       type: 'not_found',
       title: 'Commande introuvable',
       message: 'La commande n\'existe pas ou a déjà été supprimée.',
       suggestion: 'Actualisez la page pour voir les données les plus récentes.',
       details: error.message,
       originalError: error
     };
  }

  return {
    type: 'unknown',
    title: 'Erreur inattendue',
    message: 'Une erreur inattendue s\'est produite lors de la suppression.',
    suggestion: 'Consultez les journaux détaillés ou contactez le support.',
    details: error.message || JSON.stringify(error),
    originalError: error
  };
};

export const handleDeletionError = (error, context = {}) => {
  const categorized = categorizeDeletionError(error);
  console.error(`[Deletion Error] ${categorized.title}:`, { ...categorized, context });
  return categorized;
};