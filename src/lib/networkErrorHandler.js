import { toast } from '@/components/ui/use-toast';

/**
 * Checks if an error is a network error.
 * @param {Error} error - The error object.
 * @returns {boolean} - True if it's a network error.
 */
export const isNetworkError = (error) => {
  if (!error) return false;
  
  const message = error.message || '';
  return (
    !navigator.onLine ||
    message === 'Failed to fetch' ||
    message.includes('Network request failed') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('NetworkError')
  );
};

/**
 * Retries an asynchronous operation with exponential backoff.
 * @param {Function} operation - The async function to retry.
 * @param {number} maxRetries - Maximum number of retries (default: 3).
 * @param {number} baseDelay - Base delay in ms (default: 1000).
 * @returns {Promise<any>} - The result of the operation.
 */
export const retryOperation = async (operation, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Determine if we should retry
      const isRetryable = isNetworkError(error) || (error.status >= 500 && error.status < 600);
      
      if (!isRetryable || i === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, i) + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Handles Supabase errors with user feedback.
 * @param {Error} error - The error object.
 * @param {string} context - Context description for logging.
 * @param {boolean} showToast - Whether to show a toast notification.
 * @returns {null}
 */
export const handleSupabaseError = (error, context = 'Opération', showToast = true) => {
  console.error(`${context} failed:`, error);
  
  if (error?.code === 'PGRST116') {
    return null;
  }

  if (showToast) {
    let message = "Une erreur inattendue s'est produite.";
    
    if (isNetworkError(error)) {
      message = "Problème de connexion. Veuillez vérifier votre internet.";
    } else if (error?.message) {
      message = error.message;
    }

    toast({
      title: "Erreur",
      description: message,
      variant: "destructive",
    });
  }
  
  return null;
};