import { supabase } from '@/lib/customSupabaseClient';
import { trackQuery } from './queryPerformanceMonitor';
import { withTimeout } from './networkResilience';
import { globalCircuitBreaker } from './CircuitBreaker';

export const runStartupDiagnostics = async () => {
  const results = {
    dbPing: { status: 'pending', time: 0 },
    authStatus: { status: 'pending', time: 0 },
    overallHealth: 'unknown'
  };

  console.log('🚀 Running Startup Diagnostics...');

  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.error('⚠️ Supabase environment variables are missing!');
    results.overallHealth = 'critical_error';
    return results;
  }

  // Use circuit breaker to prevent looping on reload if already failed recently
  try {
    globalCircuitBreaker.check('startup_diagnostics');
  } catch (e) {
    console.warn('⚠️ Startup diagnostics skipped (Circuit Open)');
    return results;
  }

  try {
    const start = performance.now();
    await trackQuery('Startup: DB Ping', async () => {
      await withTimeout(async () => {
        const { error } = await supabase.from('restaurants').select('id').limit(1);
        if (error) throw error;
      }, 3000); // Strict 3s timeout
    });
    results.dbPing = { status: 'ok', time: Math.round(performance.now() - start) };
  } catch (err) {
    globalCircuitBreaker.logErrorDeduped('Startup: DB Ping', err);
    results.dbPing = { status: 'error', error: err.message };
  }

  try {
    const start = performance.now();
    await trackQuery('Startup: Auth Check', async () => {
      await withTimeout(async () => {
        const { error } = await supabase.auth.getSession();
        if (error) throw error;
      }, 3000); // Strict 3s timeout
    });
    results.authStatus = { status: 'ok', time: Math.round(performance.now() - start) };
    globalCircuitBreaker.recordSuccess('startup_diagnostics');
  } catch (err) {
    globalCircuitBreaker.logErrorDeduped('Startup: Auth Check', err);
    results.authStatus = { status: 'error', error: err.message };
    globalCircuitBreaker.recordFailure('startup_diagnostics');
  }

  if (results.dbPing.status === 'ok') {
    results.overallHealth = 'good';
  } else if (results.dbPing.status === 'error') {
    results.overallHealth = 'degraded'; 
  }

  console.log('📊 Diagnostics Results:', results);
  return results; // Return unconditionally to never block initialization
};