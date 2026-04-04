import { useState, useCallback } from 'react';
import { useError } from '@/contexts/ErrorContext';
import { logger } from '@/lib/logger';
import { clearExpiredCache as utilsClearExpired } from '@/lib/cacheUtils';

const DEFAULT_TTL_MINUTES = 60; // 1 hour

export const invalidateCache = (key) => {
  try {
    localStorage.removeItem(`app_cache_${key}`);
    logger.debug('Hook Cache operation: invalidateCache', 'Status: success', `Key: ${key}`);
  } catch (e) {
    logger.error('Hook Cache invalidate error', e);
  }
};

export const clearExpiredCache = () => {
  return utilsClearExpired();
};

export const useCache = () => {
  const { reportError } = useError();
  const [isFetching, setIsFetching] = useState(false);

  const getCachedData = useCallback(async (key, fetchFn, ttlMinutes = DEFAULT_TTL_MINUTES, forceRefresh = false) => {
    const cacheKey = `app_cache_${key}`;
    const now = new Date().getTime();

    // Try to get from cache if not forcing refresh
    if (!forceRefresh) {
      try {
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (cached && cached.expiry && now < cached.expiry) {
            logger.debug(`[useCache] HIT for ${key}`);
            return cached.data;
          }
        }
      } catch (e) {
        logger.warn(`[useCache] Error reading ${key}`, e);
      }
    }

    // Fetch new data
    setIsFetching(true);
    logger.debug(`[useCache] MISS/REFRESH for ${key}. Fetching...`);
    try {
      const data = await fetchFn();
      
      // Save to cache
      try {
        const cacheItem = {
          data,
          expiry: now + (ttlMinutes * 60 * 1000)
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      } catch (storageError) {
        logger.warn(`[useCache] Storage full or error for ${key}. Trying to clear expired...`, storageError);
        clearExpiredCache();
        try {
            // Retry save once
            localStorage.setItem(cacheKey, JSON.stringify({ data, expiry: now + (ttlMinutes * 60 * 1000) }));
        } catch(e) {}
      }
      
      return data;
    } catch (error) {
      logger.error(`[useCache] Fetch error for ${key}:`, error);
      reportError(error, `Cache Fetch: ${key}`);
      
      // Fallback to stale cache if available and fetch failed
      try {
         const staleStr = localStorage.getItem(cacheKey);
         if (staleStr) {
             logger.warn(`[useCache] Returning STALE data for ${key} due to fetch error.`);
             return JSON.parse(staleStr).data;
         }
      } catch(e) {}
      throw error;
    } finally {
      setIsFetching(false);
    }
  }, [reportError]);

  return { getCachedData, isFetching, invalidateCache, clearExpiredCache };
};