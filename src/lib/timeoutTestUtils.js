/**
 * Utilities for testing timeout and retry scenarios
 */
import { withTimeout, retryWithExponentialBackoff } from './networkResilience';

export const timeoutTestUtils = {
  /**
   * Simulates a delayed promise that will naturally time out
   */
  simulateSlowRequest: async (delayMs = 15000) => {
    return new Promise(resolve => setTimeout(() => resolve('Success after delay'), delayMs));
  },

  /**
   * Tests the withTimeout wrapper
   */
  testTimeout: async (timeoutMs = 5000, simulatedDelay = 10000) => {
    console.log(`[Test] Starting timeout test. Timeout: ${timeoutMs}ms, Delay: ${simulatedDelay}ms`);
    try {
      const start = performance.now();
      await withTimeout(() => timeoutTestUtils.simulateSlowRequest(simulatedDelay), timeoutMs);
      console.log(`[Test] Completed in ${performance.now() - start}ms`);
      return { success: true };
    } catch (err) {
      console.log(`[Test] Caught expected error: ${err.message}`);
      return { success: false, error: err };
    }
  },

  /**
   * Simulates a failing request that succeeds on the Nth attempt
   */
  simulateFlakyRequest: (succeedOnAttempt = 3) => {
    let attempt = 0;
    return async () => {
      attempt++;
      if (attempt < succeedOnAttempt) {
        throw new Error('Simulated network failure');
      }
      return 'Success!';
    };
  },

  /**
   * Tests the retry logic
   */
  testRetry: async () => {
    console.log(`[Test] Starting retry test`);
    const flakyFunction = timeoutTestUtils.simulateFlakyRequest(3);
    const result = await retryWithExponentialBackoff(flakyFunction, 4, 500);
    console.log(`[Test] Retry result:`, result);
    return result;
  }
};