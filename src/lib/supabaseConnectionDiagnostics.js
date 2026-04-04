import { supabase } from './customSupabaseClient';
import { logger } from './logger';
import { withTimeout } from './networkResilience';

export const validateSupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  logger.info('Supabase URL Loaded:', !!url);
  logger.info('Supabase Key Loaded:', !!key);
  
  if (!url || !key) {
    const errorMsg = 'Supabase credentials missing from environment variables';
    logger.error(errorMsg);
    return { isValid: false, error: errorMsg };
  }
  
  return { isValid: true, urlLength: url.length, keyLength: key.length };
};

export const testSupabaseConnection = async () => {
  logger.info('Starting comprehensive Supabase connection test...');
  const results = {
    configValid: false,
    authConnection: false,
    dbConnection: false,
    networkOnline: navigator.onLine,
    errors: []
  };

  try {
    // 1. Validate Config
    const config = validateSupabaseConfig();
    results.configValid = config.isValid;
    if (!config.isValid) {
      throw new Error(config.error);
    }

    // 2. Test Auth Connection
    logger.debug('Testing auth.getSession()...');
    const { data: authData, error: authError } = await withTimeout(() => supabase.auth.getSession(), 5000);
    if (authError) {
      results.errors.push(`Auth Error: ${authError.message}`);
    } else {
      results.authConnection = true;
      logger.debug('Auth session retrieved successfully.');
    }

    // 3. Test Database Query Connection
    logger.debug('Testing simple DB query...');
    const { error: dbError } = await withTimeout(() => supabase.from('profiles').select('id').limit(1), 5000);
    
    if (dbError) {
      results.errors.push(`DB Error: ${dbError.message}`);
    } else {
      results.dbConnection = true;
      logger.debug('DB query executed successfully.');
    }

  } catch (err) {
    logger.error('Diagnostic test caught an exception:', err);
    results.errors.push(err.message || 'Unknown exception during test');
  }

  results.success = results.configValid && results.authConnection && results.dbConnection;
  
  logger.info(`Diagnostic Results: Success=${results.success}, Auth=${results.authConnection}, DB=${results.dbConnection}`);
  return results;
};

export const logDiagnostics = async () => {
  await testSupabaseConnection();
};