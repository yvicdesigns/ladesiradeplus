import { clearAuthSession } from './sessionCleanup';
import { logger } from './logger';

export const detectRefreshIssues = (error) => {
  if (!error) return false;
  const msg = error.message || '';
  const code = error.code || '';
  return (
    msg.includes('refresh_token_not_found') || 
    msg.includes('invalid_grant') ||
    code === 'refresh_token_not_found' ||
    code === 'invalid_grant'
  );
};

/**
 * Handles specifically token refresh errors to prevent infinite loops
 * and corrupted state.
 * @returns {Promise<{shouldRedirect: boolean, message?: string}>}
 */
export const handleTokenRefreshError = async (error) => {
  if (detectRefreshIssues(error)) {
    logger.warn('🔄 Token Refresh Issue Detected:', error.message || error.code);
    
    await clearAuthSession();
    
    return { 
      shouldRedirect: true, 
      message: 'Votre session a expiré. Veuillez vous reconnecter.' 
    };
  }
  
  return { shouldRedirect: false };
};