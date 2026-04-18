import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const usePendingReviewsCount = () => {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const { count: pending, error } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .not('is_deleted', 'is', true);

      if (error) throw error;
      setCount(pending || 0);
    } catch (err) {
      console.error('usePendingReviewsCount fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchCount();

    const channel = supabase
      .channel(`reviews-count-sidebar-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
        fetchCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCount]);

  return { count };
};
