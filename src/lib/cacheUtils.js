import { logger } from './logger';

/**
 * Stores data in localStorage with a Time To Live (TTL).
 * @param {string} key - Cache key.
 * @param {any} data - Data to store.
 * @param {number} ttlMinutes - TTL in minutes (default: 5).
 */
export const setInCache = (key, data, ttlMinutes = 5) => {
  try {
    const now = new Date();
    const item = {
      value: data,
      expiry: now.getTime() + ttlMinutes * 60 * 1000,
    };
    localStorage.setItem(key, JSON.stringify(item));
    logger.debug('Cache operation: setInCache', 'Status: success', `Key: ${key}`);
  } catch (e) {
    logger.error('Cache operation: setInCache', 'Status: error', 'LocalStorage full or disabled', e);
  }
};

/**
 * Retrieves data from localStorage if valid.
 * @param {string} key - Cache key.
 * @returns {any|null} - Cached data or null if expired/missing.
 */
export const getFromCache = (key) => {
  try {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) {
      logger.debug('Cache operation: getFromCache', 'Status: miss', `Key: ${key}`);
      return null;
    }
    
    const item = JSON.parse(itemStr);
    const now = new Date();
    
    // Check for corruption
    if (!item || typeof item.expiry !== 'number') {
      logger.warn('Cache operation: getFromCache', 'Status: corrupted', `Key: ${key}`);
      localStorage.removeItem(key);
      return null;
    }

    if (now.getTime() > item.expiry) {
      logger.debug('Cache operation: getFromCache', 'Status: expired', `Key: ${key}`);
      localStorage.removeItem(key);
      return null;
    }
    
    logger.debug('Cache operation: getFromCache', 'Status: hit', `Key: ${key}`);
    return item.value;
  } catch (e) {
    logger.error('Cache operation: getFromCache', 'Status: error', `Key: ${key}`, e);
    localStorage.removeItem(key);
    return null;
  }
};

/**
 * Clears specific cache entry.
 * @param {string} key - Cache key.
 */
export const clearCache = (key) => {
  try {
    localStorage.removeItem(key);
    logger.debug('Cache operation: clearCache', 'Status: success', `Key: ${key}`);
  } catch (e) {
    logger.error('Cache operation: clearCache', 'Status: error', `Key: ${key}`, e);
  }
};

/**
 * Clears all expired cache entries starting with 'app_cache_'.
 */
export const clearExpiredCache = () => {
  try {
    const now = new Date().getTime();
    let clearedCount = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('app_cache_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (item && item.expiry && now > item.expiry) {
            localStorage.removeItem(key);
            clearedCount++;
          }
        } catch (e) {
          // If JSON is invalid or structure is wrong, remove it
          localStorage.removeItem(key);
          clearedCount++;
        }
      }
    }
    if (clearedCount > 0) {
      logger.info(`Cache operation: clearExpiredCache`, `Cleared ${clearedCount} expired items`);
    }
    return clearedCount;
  } catch (e) {
    logger.error('Cache operation: clearExpiredCache', 'Status: error', e);
    return 0;
  }
};

/**
 * Robustly clears all application cache.
 */
export const clearAllAppCache = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('app_cache_') || key.startsWith('analytics_') || key.startsWith('reports_') || key.startsWith('orders_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    logger.info('Cache operation: clearAllAppCache', 'Status: success', `Cleared ${keysToRemove.length} keys`);
    return { success: true, count: keysToRemove.length };
  } catch (e) {
    logger.error('Cache operation: clearAllAppCache', 'Status: error', e);
    return { success: false, error: e.message };
  }
};