import { TIMEOUT_CONFIG } from './timeoutConfig';
import { retryWithExponentialBackoff, withTimeout as networkWithTimeout } from './networkResilience';
import { trackQuery } from './queryPerformanceMonitor';

export const SupabaseErrorTypes = {
  NETWORK: 'network',
  AUTH: 'auth',
  RLS: 'rls',
  TIMEOUT: 'timeout',
  DATA: 'data',
  UUID: 'uuid',
  CONSTRAINT: 'constraint',
  REALTIME: 'realtime',
  UNKNOWN: 'unknown'
};

export const categorizeError = (error) => {
  if (!error) return SupabaseErrorTypes.UNKNOWN;
  const msg = (error.message || '').toLowerCase();
  const code = (error.code || '').toLowerCase();

  if (msg.includes('invalid input syntax for type uuid')) return SupabaseErrorTypes.UUID;
  if (msg.includes('realtime') || msg.includes('channel')) return SupabaseErrorTypes.REALTIME;
  if (msg.includes('failed to fetch') || msg.includes('network') || error.name === 'TypeError') return SupabaseErrorTypes.NETWORK;
  if (msg.includes('jwt') || msg.includes('auth') || code.includes('auth')) return SupabaseErrorTypes.AUTH;
  if (code === '42501' || msg.includes('policy') || msg.includes('rls')) return SupabaseErrorTypes.RLS;
  if (code === '23503' || msg.includes('foreign key constraint')) return SupabaseErrorTypes.CONSTRAINT;
  if (msg.includes('timeout') || error.name === 'AbortError' || error.name === 'TimeoutError') return SupabaseErrorTypes.TIMEOUT;
  if (code.startsWith('22') || code.startsWith('23')) return SupabaseErrorTypes.DATA;
  
  return SupabaseErrorTypes.UNKNOWN;
};

export const logSupabaseError = (error, context = 'Unknown Context') => {
  const type = categorizeError(error);
  console.error(`🚨 [Supabase Error] [${context}] Type: ${type}, Message: ${error?.message}`);
  return { type, error };
};

export const getFriendlyErrorMessage = (error, context = '') => {
  const type = categorizeError(error);
  const prefix = context ? `${context} : ` : '';
  
  switch (type) {
    case SupabaseErrorTypes.NETWORK:
      return `${prefix}Problème de connexion réseau. Veuillez vérifier votre internet.`;
    case SupabaseErrorTypes.AUTH:
      return `${prefix}Erreur d'authentification. Veuillez vous reconnecter.`;
    case SupabaseErrorTypes.RLS:
      return `${prefix}Vous n'avez pas les permissions nécessaires pour cette action.`;
    case SupabaseErrorTypes.TIMEOUT:
      return `${prefix}Le serveur a mis trop de temps à répondre. Veuillez réessayer.`;
    case SupabaseErrorTypes.UUID:
      return `${prefix}L'identifiant fourni est invalide (UUID).`;
    case SupabaseErrorTypes.DATA:
      return `${prefix}Les données fournies sont invalides.`;
    case SupabaseErrorTypes.CONSTRAINT:
      return `${prefix}Cette action est bloquée car elle affecte d'autres données existantes.`;
    case SupabaseErrorTypes.REALTIME:
      return `${prefix}Erreur de synchronisation en temps réel.`;
    default:
      return `${prefix}${error?.message || "Une erreur inattendue est survenue."}`;
  }
};

export const detectAndHandleUUIDErrors = (error) => {
  const isUUIDError = error?.message?.includes('invalid input syntax for type uuid');
  return {
    isUUIDError,
    message: isUUIDError ? "Format d'identifiant UUID invalide." : (error?.message || 'Erreur inconnue'),
    type: isUUIDError ? SupabaseErrorTypes.UUID : categorizeError(error)
  };
};

/**
 * Handle Supabase single() query errors gracefully to prevent crashes
 * when zero or multiple rows are returned instead of exactly one.
 */
export const handleSingleQueryError = (error) => {
  if (!error) return null;
  
  // PGRST116: JSON object requested, multiple (or zero) rows returned
  if (error.code === 'PGRST116' || error.message?.includes('JSON object') || error.message?.includes('single')) {
    return {
      error: true,
      message: "Enregistrement introuvable. La donnée a pu être supprimée ou vous n'y avez pas accès.",
      code: error.code || 'PGRST116'
    };
  }
  
  return { 
    error: true, 
    message: error.message || "Une erreur est survenue lors de la récupération des données.", 
    code: error.code 
  };
};

/**
 * Enhanced execution wrapper with Performance Tracking, Retry, and Cancellation.
 */
export const executeWithResilience = async (operation, options = {}) => {
  const maxRetries = options.maxRetries ?? TIMEOUT_CONFIG.MAX_RETRIES;
  const baseDelay = options.baseDelay ?? TIMEOUT_CONFIG.RETRY_BACKOFF_BASE;
  const timeoutMs = options.timeout ?? TIMEOUT_CONFIG.QUERY_TIMEOUT;
  const context = options.context ?? 'Supabase Operation';
  const fallbackValue = options.fallbackValue;

  const performOperation = async () => {
    return await trackQuery(context, async () => {
      return await networkWithTimeout(
        (signal) => operation(signal), 
        timeoutMs,
        fallbackValue
      );
    });
  };

  const result = await retryWithExponentialBackoff(performOperation, maxRetries, baseDelay);

  if (!result.success) {
    if (fallbackValue !== undefined && result.error?.name === 'TimeoutError') {
      console.warn(`[Resilience] ${context} timed out after retries. Returning fallback.`);
      return fallbackValue;
    }
    logSupabaseError(result.error, `${context} (Failed after ${result.attempts} attempts)`);
    throw result.error;
  }

  return result.data;
};