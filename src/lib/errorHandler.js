export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

export const normalizeSupabaseError = (error) => {
  if (!error) return null;
  return {
    message: error.message || 'Une erreur est survenue avec la base de données',
    code: error.code || 'UNKNOWN_ERROR',
    details: error.details || ''
  };
};

export const normalizeRPCError = (error) => {
  if (!error) return null;
  return {
    message: error.message || 'Une erreur est survenue lors de l\'appel RPC',
    code: error.code || 'RPC_ERROR'
  };
};

export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  return error?.message || 'Une erreur inattendue est survenue.';
};

export const logError = (error, context = 'Global') => {
  console.error(`[${context}] Error:`, error);
};

export const handleError = (error, context = 'Global') => {
  logError(error, context);
  
  if (!error) return ErrorTypes.UNKNOWN_ERROR;
  
  const msg = (error.message || '').toLowerCase();
  
  if (msg.includes('timeout') || error.name === 'TimeoutError') return ErrorTypes.TIMEOUT;
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) return ErrorTypes.NETWORK_ERROR;
  if (msg.includes('auth') || msg.includes('credentials') || msg.includes('jwt')) return ErrorTypes.AUTH_ERROR;
  
  return ErrorTypes.UNKNOWN_ERROR;
};

export const showErrorToUser = (error, context = '') => {
  const message = getErrorMessage(error);
  // Ideally this connects to a toast notification system, but fallback to console for now
  console.error(`Displaying Error to User [${context}]:`, message);
};