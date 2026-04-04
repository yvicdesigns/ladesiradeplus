import { supabase } from '@/lib/customSupabaseClient';
import { executeWithResilience } from './supabaseErrorHandler';

// In-memory cache for admin settings to prevent redundant queries
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let adminSettingsCache = {
  data: null,
  timestamp: 0
};

export const clearAdminSettingsCache = () => {
  adminSettingsCache = { data: null, timestamp: 0 };
};

/**
 * Fetches admin settings, utilizing an in-memory cache and a fast RPC.
 */
export const getAdminSettingsCached = async (restaurantId = null, forceRefresh = false) => {
  const now = Date.now();
  
  if (!forceRefresh && adminSettingsCache.data && (now - adminSettingsCache.timestamp < CACHE_TTL_MS)) {
    return adminSettingsCache.data;
  }

  try {
    const data = await executeWithResilience(
      async () => {
        // Use the newly created SECURITY DEFINER RPC for optimized reading
        const { data: rpcData, error } = await supabase.rpc('get_admin_settings_secure', {
            p_restaurant_id: restaurantId
        });
        
        if (error) throw error;
        // RPC returns JSONB. If empty, it returns '{}'.
        if (!rpcData || Object.keys(rpcData).length === 0) return null;
        return rpcData;
      },
      { 
        context: 'Fetch Admin Settings Cache', 
        timeout: 3000, 
        maxRetries: 2 
      }
    );

    if (data) {
      adminSettingsCache = { data, timestamp: now };
    }
    return data;
  } catch (err) {
    console.error('[Cache] Failed to fetch admin settings:', err);
    // If it fails, return whatever is in cache even if expired, to keep app alive
    return adminSettingsCache.data;
  }
};