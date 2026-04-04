import { supabase } from '@/lib/customSupabaseClient';
import { logger } from '@/lib/logger';
import { categorizeError } from '@/lib/supabaseErrorHandler';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fallback notification preferences initialization function.
 * Checks for existing prefs, creates defaults if missing, uses exponential backoff.
 * 
 * @param {string} userId - The authenticated user's ID
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<object|null>} The preferences object or null if failed (graceful fallback)
 */
export const initializeNotificationPreferences = async (userId, maxRetries = 3) => {
  if (!userId) {
    logger.warn('[NotificationPrefs] Cannot initialize: No user ID provided.');
    return null;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`[NotificationPrefs] Fetch attempt ${attempt} for user ${userId}`);
      
      // 1. Wrap in try-catch with 5s timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) throw error;

      // 2. Return existing preferences if found
      if (data) {
        logger.info(`[NotificationPrefs] Successfully fetched preferences on attempt ${attempt}.`);
        return data;
      }

      // 3. Create defaults if missing
      logger.info(`[NotificationPrefs] No preferences found for user ${userId}. Creating defaults...`);
      const defaultPrefs = {
        user_id: userId,
        email_enabled: true,
        push_enabled: true,
        sms_enabled: false
      };

      const { data: newPrefs, error: insertError } = await supabase
        .from('notification_preferences')
        .insert(defaultPrefs)
        .select()
        .single();
        
      if (insertError) throw insertError;
      
      logger.info(`[NotificationPrefs] Successfully created default preferences.`);
      return newPrefs;

    } catch (error) {
      // Log specific error type
      const errType = categorizeError(error);
      const isTimeout = error.name === 'AbortError' || errType === 'timeout';
      
      logger.warn(
        `[NotificationPrefs] Attempt ${attempt} failed: [${errType}] ${isTimeout ? 'Request timed out after 5s' : error.message}`
      );
      
      // 4. Graceful fallback on final attempt
      if (attempt === maxRetries) {
        logger.error(`[NotificationPrefs] All ${maxRetries} attempts failed. Returning null to allow app to continue.`);
        return null; 
      }
      
      // Automatic retry logic with exponential backoff (1s -> 2s -> 4s, capped at 3s)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
      logger.info(`[NotificationPrefs] Retrying in ${waitTime}ms...`);
      await delay(waitTime);
    }
  }
  
  return null;
};