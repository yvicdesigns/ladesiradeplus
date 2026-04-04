export const isRLSError = (error) => {
  if (!error) return false;
  return error.code === '42501' || 
         (error.message && error.message.toLowerCase().includes('rls')) ||
         (error.message && error.message.toLowerCase().includes('policy')) ||
         (error.message && error.message.toLowerCase().includes('permission denied'));
};

export const getRLSErrorMessage = (operation, table) => {
  const op = operation?.toUpperCase() || '';
  switch (op) {
    case 'SELECT': return "Vous n'avez pas la permission de lire cette table.";
    case 'UPDATE': return "Vous n'avez pas la permission de modifier cette table.";
    case 'DELETE': return "Vous n'avez pas la permission de supprimer cette table.";
    case 'INSERT': return "Vous n'avez pas la permission d'ajouter des données à cette table.";
    default: return "Vous devez être administrateur pour effectuer cette opération.";
  }
};

export const logRLSError = (error, context) => {
  console.error(`[RLS Error - ${context}]`, error);
};

export const handleRLSError = (error, operation = 'OPERATION', table = 'table') => {
  if (!isRLSError(error)) return null;
  
  logRLSError(error, `${operation} on ${table}`);
  
  return {
    isRLSError: true,
    code: error.code,
    message: getRLSErrorMessage(operation, table),
    originalMessage: error.message,
    suggestion: "Vérifiez vos rôles administrateur ou contactez le support technique. Utilisez la page de diagnostic RLS pour plus d'informations."
  };
};