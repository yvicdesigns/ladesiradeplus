import { supabase } from '@/lib/customSupabaseClient';

export const getLocalDateString = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

// Helper for exponential backoff
const retryOperation = async (operation, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      // Don't retry if it's not a network/fetch error (optional refinement)
      console.warn(`Attempt ${i + 1} failed. Retrying...`, error);
      
      // Wait with exponential backoff: 1s, 2s, 4s...
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

export const resetOrdersDaily = async () => {
  // Quick check for network connectivity before attempting
  if (!navigator.onLine) {
    console.log('Offline: Skipping daily order reset check.');
    return false;
  }

  const performResetCheck = async () => {
    // 1. Get Config
    const { data: configs, error } = await supabase
      .from('admin_config')
      .select('*')
      .in('config_key', ['daily_reset_enabled', 'daily_reset_time', 'last_reset_at']);

    if (error) throw error;

    const enabled = configs.find(c => c.config_key === 'daily_reset_enabled')?.config_value === 'true';
    const resetTime = configs.find(c => c.config_key === 'daily_reset_time')?.config_value || '00:00';
    const lastResetStr = configs.find(c => c.config_key === 'last_reset_at')?.config_value;

    if (!enabled) return false;

    // 2. Check Time
    const now = new Date();
    const [hours, minutes] = resetTime.split(':').map(Number);
    const resetTarget = new Date();
    resetTarget.setHours(hours, minutes, 0, 0);

    const lastResetDate = lastResetStr ? new Date(lastResetStr).toDateString() : null;
    const todayDate = now.toDateString();

    // If we have passed the reset time AND we haven't reset today yet
    if (now >= resetTarget && lastResetDate !== todayDate) {
      console.log('Triggering Daily Order Reset...');
      
      const { data, error: funcError } = await supabase.functions.invoke('daily-order-reset');
      
      if (funcError) {
        throw new Error(`Reset function failed: ${funcError.message}`);
      }
      
      return true;
    }

    return false;
  };

  try {
    // Wrap the main logic in the retry handler
    await retryOperation(performResetCheck);
    return true;
  } catch (err) {
    console.error('Error in resetOrdersDaily after retries:', err);
    return false;
  }
};