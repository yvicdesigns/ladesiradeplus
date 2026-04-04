import { TIMEOUT_CONFIG } from './timeoutConfig';

export const fetchWithTimeout = async (promise, ms = TIMEOUT_CONFIG.FETCH_TIMEOUT, timeoutMessage = "Délai de connexion dépassé") => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error(`${timeoutMessage} (${ms}ms)`);
      err.name = 'TimeoutError';
      err.code = 'TIMEOUT';
      console.warn(`[TimeoutUtils] Operation timed out after ${ms}ms:`, timeoutMessage);
      reject(err);
    }, ms);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
};