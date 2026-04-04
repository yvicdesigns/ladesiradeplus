import { validateSupabaseConfig, testSupabaseConnection } from './supabaseConnectionDiagnostics';
import { logger, logBuffer } from './logger';
import { supabase } from './customSupabaseClient';

/**
 * Generates a comprehensive diagnostic report of the application's health.
 */
export const generateDiagnosticReport = async () => {
  logger.info('Generating comprehensive diagnostic report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    },
    network: {
      online: navigator.onLine,
      connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown'
    },
    supabase: {
      config: validateSupabaseConfig(),
      connectionTest: null,
      authStatus: null
    },
    cache: {
      localStorageKeys: []
    },
    recentLogs: [...logBuffer]
  };

  try {
    // 1. Connection Test
    report.supabase.connectionTest = await testSupabaseConnection();

    // 2. Auth Status
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    report.supabase.authStatus = {
      isAuthenticated: !!session,
      user: session?.user?.email || null,
      error: authError ? authError.message : null
    };

    // 3. Cache Info
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) report.cache.localStorageKeys.push(key);
      }
    } catch (e) {
      report.cache.error = e.message;
    }

  } catch (err) {
    report.globalError = err.message;
  }

  logger.info('Diagnostic report generation complete.');
  return report;
};