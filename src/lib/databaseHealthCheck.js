import { supabase } from '@/lib/customSupabaseClient';

// In-memory cache to persist across component re-renders but not page reloads
let healthCache = {
  data: null,
  timestamp: null,
  history: []
};

const CACHE_DURATION = 30000; // 30 seconds
const PING_TIMEOUT = 5000; // 5 seconds

/**
 * Checks database health with a lightweight query.
 * Uses caching to prevent spamming the database.
 * @param {boolean} force - If true, bypasses cache.
 * @returns {Promise<{status: string, latency: number, timestamp: Date, error: any}>}
 */
export const checkDatabaseHealth = async (force = false) => {
  const now = Date.now();

  // Return cached result if valid and not forced
  if (!force && healthCache.data && healthCache.timestamp && (now - healthCache.timestamp < CACHE_DURATION)) {
    return { 
      ...healthCache.data, 
      cached: true 
    };
  }

  const start = performance.now();
  let status = 'error';
  let error = null;
  let latency = 0;

  try {
    // 1. Lightweight Ping: Use HEAD request to avoid downloading data.
    // We check 'admin_config' or 'profiles' - any table that definitely exists.
    // count='exact' with head=true is extremely light.
    
    // Create an AbortController for the timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);

    const { error: queryError } = await supabase
      .from('admin_config')
      .select('*', { count: 'exact', head: true })
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    const end = performance.now();
    latency = Math.round(end - start);

    if (queryError) {
      // If code is PGRST116 (JSON object requested, multiple (or no) rows returned), it's actually a success for connectivity
      if (queryError.code === 'PGRST116') {
         status = 'connected';
      } else {
         throw queryError;
      }
    } else {
      status = 'connected';
    }

  } catch (err) {
    const end = performance.now();
    latency = Math.round(end - start);
    error = err;
    
    if (err.name === 'AbortError') {
      status = 'timeout';
      error = { message: 'Connection timed out (>5000ms)' };
    } else {
      status = 'error';
    }
    console.error('Database Health Check Failed:', err);
  }

  const result = {
    status,
    latency,
    timestamp: new Date(),
    error,
    cached: false
  };

  // Update Cache
  healthCache.data = result;
  healthCache.timestamp = now;
  
  // Update History (keep last 10)
  const newHistory = [...healthCache.history, { latency, timestamp: new Date(), status }];
  if (newHistory.length > 10) newHistory.shift();
  healthCache.history = newHistory;

  return result;
};

/**
 * Returns the current cached status without triggering a check.
 */
export const getCachedStatus = () => {
  return healthCache.data;
};

/**
 * Returns the latency history.
 */
export const getHealthHistory = () => {
  return healthCache.history;
};

/**
 * Clears the health cache.
 */
export const clearHealthCache = () => {
  healthCache.data = null;
  healthCache.timestamp = null;
};