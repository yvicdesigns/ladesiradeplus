import { supabase } from '@/lib/customSupabaseClient';

export const SINGLE_RESTAURANT_ID = '7eedf081-0268-4867-af38-61fa5932420a';

let isVerified = false;

export const verifyRestaurantSetup = async () => {
  if (isVerified) return { success: true, cached: true };

  try {
    const { data, error } = await supabase.rpc('verify_single_restaurant_setup');
    
    if (error) {
      console.error('[SingleRestaurantSetup] Verification RPC error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('[SingleRestaurantSetup] Integrity Check Results:', data);
    
    if (data?.success) {
      isVerified = true;
    } else {
      console.warn('[SingleRestaurantSetup] Warning:', data?.message);
    }
    
    return data;
  } catch (err) {
    console.error('[SingleRestaurantSetup] Setup verification failed:', err);
    return { success: false, error: err.message };
  }
};