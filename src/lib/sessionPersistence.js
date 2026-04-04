import { supabase } from './customSupabaseClient';
import { handleTokenRefreshError } from './tokenRefreshHandler';
import { logger } from './logger';
import { fetchWithTimeout } from './timeoutUtils';
import { TIMEOUT_CONFIG } from './timeoutConfig';
import { clearAuthSession } from './sessionCleanup';

export const verifyAndRestoreSession = async () => {
  try {
    logger.info('Session verification: starting');
    
    if (!navigator.onLine) {
       logger.warn('Session verification skipped: Network offline');
       return { isValid: false, session: null };
    }

    const sessionPromise = supabase.auth.getSession();
    const { data: { session }, error } = await fetchWithTimeout(
      sessionPromise, 
      TIMEOUT_CONFIG.SESSION_TIMEOUT || 10000, 
      "Session verification timed out"
    );
    
    if (error) {
      logger.error('Session verification error:', error);
      const { shouldRedirect } = await handleTokenRefreshError(error);
      if (shouldRedirect) {
        logger.info('Session was corrupted and has been cleared.');
        return { isValid: false, shouldRedirect: true, session: null };
      }
      throw error;
    }
    
    if (session) {
      logger.info('Session verification: active', 'User:', session.user?.email);
      const expiresAt = session.expires_at * 1000;
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
         logger.info('Token expiring soon, attempting proactive refresh...');
         try {
           const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
           if (refreshError) {
               logger.error('Proactive token refresh failed:', refreshError);
               const result = await handleTokenRefreshError(refreshError);
               if (result.shouldRedirect) {
                 return { isValid: false, shouldRedirect: true, session: null };
               }
           } else {
               logger.info('Proactive token refresh succeeded');
               return { isValid: true, session: refreshData.session };
           }
         } catch (refreshException) {
           logger.error('Proactive token refresh exception:', refreshException);
           await clearAuthSession();
           return { isValid: false, shouldRedirect: true, session: null };
         }
      }
      return { isValid: true, session };
    } else {
      logger.info('Session verification: none');
      return { isValid: false, session: null };
    }
  } catch (err) {
    logger.error('Session verification failed or timed out:', err);
    return { isValid: false, session: null }; // Don't block the app loading on session timeout
  }
};