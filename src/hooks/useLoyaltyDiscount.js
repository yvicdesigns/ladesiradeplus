import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const DEFAULT = { enabled: true, percent: 5 };
let cache = null;

export function useLoyaltyDiscount() {
  const [settings, setSettings] = useState(cache || DEFAULT);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    supabase
      .from('admin_settings')
      .select('loyalty_discount_enabled, loyalty_discount_percent')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        const result = {
          enabled: data?.loyalty_discount_enabled ?? true,
          percent: parseFloat(data?.loyalty_discount_percent ?? 5),
        };
        cache = result;
        setSettings(result);
        setLoading(false);
      });
  }, []);

  return { settings, loading };
}

export function clearLoyaltyCache() {
  cache = null;
}
