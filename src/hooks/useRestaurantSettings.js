import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useCache } from './useCache';
import { isValidAdminSettingsId } from '@/lib/adminSettingsUtils';

export const SINGLE_RESTAURANT_ID = RESTAURANT_ID;

export const useRestaurantSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getCachedData } = useCache();

  const fetchSettings = useCallback(async (forceRefresh = false) => {
    // Prevent querying if the UUID is somehow invalid (though hardcoded here)
    if (!isValidAdminSettingsId(SINGLE_RESTAURANT_ID)) {
      console.error('🚨 [useRestaurantSettings] Invalid SINGLE_RESTAURANT_ID detected. Query aborted.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getCachedData(
        'restaurant_settings',
        async () => {
          const { data, error } = await supabase
            .from('admin_settings')
            .select('*')
            .eq('restaurant_id', SINGLE_RESTAURANT_ID)
            .eq('is_deleted', false)
            .limit(1)
            .maybeSingle();
          
          if (error) throw error;
          return data;
        },
        1440,
        forceRefresh
      );
      setSettings(data || {});
    } catch (err) {
      console.error('🚨 [useRestaurantSettings] Fetch failed:', err);
      setSettings({});
    } finally {
      setLoading(false);
    }
  }, [getCachedData]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, refetch: () => fetchSettings(true) };
};