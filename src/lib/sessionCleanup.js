import { supabase } from './customSupabaseClient';
import { logger } from './logger';

/**
 * Utility to completely clear the authentication session and related cached data.
 */
export const clearAuthSession = async () => {
  logger.info('[SessionCleanup] Initiating complete session cleanup');
  try {
    // 1. Remove Supabase auth tokens from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        localStorage.removeItem(key);
        logger.debug(`[SessionCleanup] Removed auth key: ${key}`);
      }
    });

    // 2. Clear cached app data
    localStorage.removeItem('active_restaurant_id');
    localStorage.removeItem('cached_restaurant_id');

    // 3. Clear Supabase session (client-side and server-side if possible)
    await supabase.auth.signOut().catch((e) => {
      logger.warn('[SessionCleanup] Supabase signOut threw error, ignoring:', e.message);
    });

    logger.info('[SessionCleanup] Session cleanup completed successfully');
  } catch (error) {
    logger.error('[SessionCleanup] Error during session cleanup:', error);
  }
};