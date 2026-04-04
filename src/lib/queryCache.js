import { getFromCache, setInCache } from './cacheUtils';

/**
 * Specialized cache for database queries.
 * Wrapper around existing cacheUtils with specific preset TTLs.
 */

const TTL = {
  ORDERS: 2,         // 2 minutes (orders change fast)
  MENU: 15,          // 15 minutes
  CUSTOMERS: 10,     // 10 minutes
  SETTINGS: 60,      // 60 minutes
  STATIC: 1440       // 24 hours
};

export const queryCache = {
  // Get generic item
  get: (key) => getFromCache(`qc_${key}`),
  
  // Set generic item
  set: (key, data, type = 'STATIC') => {
    const ttl = TTL[type] || 5;
    setInCache(`qc_${key}`, data, ttl);
  },
  
  // Specific helpers
  getOrders: (page, filter) => getFromCache(`qc_orders_${page}_${JSON.stringify(filter)}`),
  setOrders: (page, filter, data) => setInCache(`qc_orders_${page}_${JSON.stringify(filter)}`, data, TTL.ORDERS),
  
  invalidate: (keyPattern) => {
    Object.keys(localStorage).forEach(key => {
      if (key.includes(keyPattern)) {
        localStorage.removeItem(key);
      }
    });
  }
};