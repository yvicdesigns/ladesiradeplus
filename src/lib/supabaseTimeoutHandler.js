import { supabase } from './customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { getFromCache, setInCache } from './cacheUtils';

const DEFAULT_TIMEOUT = 5000;
const MAX_RETRIES = 3;

/**
 * Executes a Supabase query with timeout, retry logic, and fallback caching.
 * @param {Function} queryBuilder - Function that returns a Supabase query promise.
 * @param {string} cacheKey - Unique key for caching results.
 * @param {object} options - Options for timeout, retries, etc.
 */
export const executeQuery = async (queryBuilder, cacheKey = null, options = {}) => {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = MAX_RETRIES,
    fallbackToCache = true,
    forceRefresh = false,
    staleWhileRevalidate = false
  } = options;

  // 1. Check Cache (if not forced)
  if (!forceRefresh && cacheKey) {
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      if (!staleWhileRevalidate) {
        return { data: cachedData, error: null, fromCache: true };
      }
      // If stale-while-revalidate, return cache immediately but continue to fetch
    }
  }

  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timed out')), timeout);
      });

      // Execute query
      const { data, error } = await Promise.race([
        queryBuilder(),
        timeoutPromise
      ]);

      if (error) throw error;

      // Success - Update Cache
      if (cacheKey && data) {
        setInCache(cacheKey, data, options.cacheTtl || 5); // Default 5 mins
      }

      return { data, error: null, fromCache: false };

    } catch (err) {
      lastError = err;
      attempt++;
      
      // Exponential backoff
      if (attempt <= retries) {
        const delay = 100 * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  // If all retries failed
  if (fallbackToCache && cacheKey) {
    const cachedData = getFromCache(cacheKey); // Try to get expired cache if possible? (Current cacheUtils removes expired)
    // In a real app we might keep expired cache for emergency fallback
    if (cachedData) {
        toast({
            title: "Connexion lente",
            description: "Affichage des données en cache.",
            variant: "warning"
        });
        return { data: cachedData, error: lastError, fromCache: true, isFallback: true };
    }
  }

  return { data: null, error: lastError };
};