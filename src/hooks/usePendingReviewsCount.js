import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

// Stable ID generated once per module load — Date.now() could collide when
// multiple instances mount within the same millisecond
const CHANNEL_ID = `reviews-count-sidebar-${Math.random().toString(36).slice(2)}`;

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

    // Remove any stale channel with this ID before subscribing
    supabase.getChannels()
      .filter(c => c.topic === `realtime:${CHANNEL_ID}`)
      .forEach(c => supabase.removeChannel(c));

    const channel = supabase
      .channel(CHANNEL_ID)
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
