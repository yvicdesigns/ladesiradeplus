import { withTimeout } from './networkResilience';

export const runTimeoutTests = async () => {
  console.log('--- STARTING TIMEOUT TESTS ---');

  // Test 1: Successful Native Promise
  try {
    const successPromise = new Promise(resolve => setTimeout(() => resolve('Success 1'), 500));
    const res = await withTimeout(successPromise, 1000);
    console.log('Test 1 (Native Promise Success): PASSED', res);
  } catch (e) {
    console.error('Test 1 FAILED', e);
  }

  // Test 2: Timeout Native Promise
  try {
    const slowPromise = new Promise(resolve => setTimeout(() => resolve('Too late'), 1500));
    await withTimeout(slowPromise, 500);
    console.error('Test 2 FAILED: Should have timed out');
  } catch (e) {
    if (e.name === 'TimeoutError') {
      console.log('Test 2 (Native Promise Timeout): PASSED');
    } else {
      console.error('Test 2 FAILED with wrong error', e);
    }
  }

  // Test 3: Object without .finally() (Mocking Supabase query builder)
  try {
    const mockThenable = {
      then: function(resolve) {
        setTimeout(() => resolve('Success 3'), 500);
      }
    };
    const res = await withTimeout(mockThenable, 1000);
    console.log('Test 3 (Thenable without .finally Success): PASSED', res);
  } catch (e) {
    console.error('Test 3 FAILED', e);
  }

  // Test 4: Object without .finally() Timeout
  try {
    const mockThenableSlow = {
      then: function(resolve) {
        setTimeout(() => resolve('Too late 4'), 1500);
      }
    };
    await withTimeout(mockThenableSlow, 500);
    console.error('Test 4 FAILED: Should have timed out');
  } catch (e) {
    if (e.name === 'TimeoutError') {
      console.log('Test 4 (Thenable without .finally Timeout): PASSED');
    } else {
      console.error('Test 4 FAILED with wrong error', e);
    }
  }

  console.log('--- TIMEOUT TESTS COMPLETE ---');
};