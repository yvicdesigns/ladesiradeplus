import { supabase } from '@/lib/customSupabaseClient';
import { TIMEOUT_CONFIG } from './timeoutConfig';
import { globalCircuitBreaker } from './CircuitBreaker';

let isSlowNetwork = false;
let isOffline = !navigator.onLine;

const failedRequestQueue = [];

window.addEventListener('online', () => {
  isOffline = false;
  console.log('[Network] Back online. Processing queue...');
  processQueue();
});

window.addEventListener('offline', () => {
  isOffline = true;
  console.log('[Network] Went offline.');
});

export const reportSlowNetwork = () => {
  if (!isSlowNetwork) {
    isSlowNetwork = true;
    console.warn("[Network] Detected as slow network.");
  }
};

export const getNetworkStatus = () => ({ isOffline, isSlowNetwork });

export const queueFailedRequest = (requestFn, context) => {
  if (failedRequestQueue.length > 50) failedRequestQueue.shift(); // Max 50 items
  failedRequestQueue.push({ fn: requestFn, context, timestamp: Date.now() });
  console.log(`[Network] Queued failed request: ${context}`);
};

const processQueue = async () => {
  while (failedRequestQueue.length > 0) {
    const req = failedRequestQueue.shift();
    try {
      console.log(`[Network] Retrying queued request: ${req.context}`);
      await req.fn();
    } catch (e) {
      console.error(`[Network] Queued request failed again: ${req.context}`);
    }
  }
};

export const withTimeout = async (promiseFn, ms = 5000, fallbackValue = undefined) => {
  const abortController = new AbortController();
  
  const timeoutPromise = new Promise((_, reject) => {
    const id = setTimeout(() => {
      abortController.abort();
      const err = new Error(`Operation timed out after ${ms}ms`);
      err.name = 'TimeoutError';
      reject(err);
    }, ms);
    abortController.signal.addEventListener('abort', () => clearTimeout(id));
  });

  try {
    const result = await Promise.race([
      Promise.resolve(promiseFn(abortController.signal)), 
      timeoutPromise
    ]);
    return result;
  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.warn(`[NetworkResilience] ${error.message}`);
      if (fallbackValue !== undefined) {
        return fallbackValue;
      }
    }
    throw error;
  }
};

export const retryWithExponentialBackoff = async (
  fn, 
  maxRetries = 3, 
  baseDelay = 1000,
  context = 'unknown_operation'
) => {
  let attempt = 0;
  
  // Fast fail if circuit is open
  try {
    globalCircuitBreaker.check(context);
  } catch (err) {
    return { success: false, error: err, errorType: 'CIRCUIT_OPEN', attempts: 0 };
  }
  
  while (attempt <= maxRetries) {
    try {
      const result = await fn();
      globalCircuitBreaker.recordSuccess(context);
      return { success: true, data: result, attempts: attempt + 1 };
    } catch (error) {
      attempt++;
      
      const isNetworkError = 
        error.message === 'Failed to fetch' || 
        error.message === 'Load failed' ||
        error.message?.includes('NetworkError') || 
        error.message?.includes('timed out') ||
        error.name === 'TimeoutError' ||
        error.name === 'AbortError' ||
        error.name === 'TypeError'; 
      
      if (attempt > maxRetries) {
        globalCircuitBreaker.recordFailure(context);
        globalCircuitBreaker.logErrorDeduped(context, error);
        return { 
          success: false, 
          error: error, 
          errorType: isNetworkError ? 'NETWORK_ERROR' : 'SERVER_ERROR',
          attempts: attempt 
        };
      }
      
      if (!isNetworkError && error.code && ['42501', '23505', '23503', '22P02'].includes(error.code)) {
        throw error;
      }
      
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 5000); // Max 5s delay
      const jitter = Math.random() * 200;
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }
};