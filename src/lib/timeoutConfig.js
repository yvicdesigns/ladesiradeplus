/**
 * Centralized timeout and retry configuration.
 * Increased timeouts to 10000ms to handle slower networks gracefully
 * and prevent aggressive premature failures.
 */
export const TIMEOUT_CONFIG = {
  // Global fetch/query timeout increased to 10 seconds
  FETCH_TIMEOUT: 10000, 
  QUERY_TIMEOUT: 10000,
  
  // Mutations usually take longer, especially if edge functions are involved
  MUTATION_TIMEOUT: 15000,
  
  // Realtime connection establishment timeout
  REALTIME_TIMEOUT: 10000,
  
  // Auth operations timeout
  SESSION_TIMEOUT: 10000,
  
  // Retry strategy
  MAX_RETRIES: 3, // 3-5 attempts recommended
  RETRY_BACKOFF_BASE: 1000, // Exponential backoff base (1s)
  
  // Fixed delay between retries if backoff is not used
  RETRY_DELAY: 1000 
};