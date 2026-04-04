import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useCache } from './useCache';
import { ensureArray } from '@/lib/dataValidation';

export const useBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getCachedData } = useCache();

  const fetchBanners = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = await getCachedData(
        'promo_banners_active',
        async () => {
          const { data, error } = await supabase
            .from('promo_banners')
            .select('*')
            .eq('is_active', true)
            .eq('is_deleted', false)
            .order('display_order', { ascending: true });
          
          if (error) throw error;
          return data;
        },
        60, // 1 hour TTL
        forceRefresh
      );
      setBanners(ensureArray(data));
    } finally {
      setLoading(false);
    }
  }, [getCachedData]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  return { banners, loading, refetch: () => fetchBanners(true) };
};