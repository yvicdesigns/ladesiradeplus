import { supabase } from '@/lib/customSupabaseClient';
import { DEFAULT_ADMIN_SETTINGS_ID } from './adminSettingsUtils';
import { executeWithResilience } from './supabaseErrorHandler';

/**
 * Optimized ensureAdminSettingsExists
 */
export const ensureAdminSettingsExists = async () => {
  return executeWithResilience(
    async () => {
      // 1. Try to fetch at least one record efficiently
      const { data, error } = await supabase
        .from('admin_settings')
        .select('id, restaurant_id')
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // 2. If no record exists, initialize via RPC
      if (!data) {
        console.log("ℹ️ [adminSettingsSetup] No admin settings found. Initializing...");
        
        const sessionData = await supabase.auth.getSession();
        const adminId = sessionData.data?.session?.user?.id || '00000000-0000-0000-0000-000000000000';
        
        const { data: rpcData, error: rpcError } = await supabase.rpc('initialize_restaurant_and_settings', {
            p_restaurant_name: "Default Restaurant",
            p_admin_id: adminId,
            p_settings_data: { id: DEFAULT_ADMIN_SETTINGS_ID }
        });
        
        if (rpcError || !rpcData?.success) {
            throw new Error(rpcError?.message || rpcData?.error || "Failed to initialize");
        }
        return rpcData.admin_settings_id;
      }
      
      return data.id;
    },
    { context: 'Ensure Admin Settings Exists', timeout: 5000, maxRetries: 2 }
  );
};