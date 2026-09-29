import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

// Stable ID generated once per module load — Date.now() could collide when
// multiple instances mount within the same millisecond
const CHANNEL_ID = `restaurant-orders-count-${Math.random().toString(36).slice(2)}`;

export const useRestaurantOrdersCount = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = async () => {
    try {
      const { count: activeCount, error } = await supabase
        .from('restaurant_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'new', 'preparation', 'ready'])
        .eq('is_deleted', false);

      if (error) throw error;
      setCount(activeCount || 0);
    } catch (error) {
      console.error('Error fetching restaurant order count:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();

    // Remove any stale channel with this ID before subscribing
    supabase.getChannels()
      .filter(c => c.topic === `realtime:${CHANNEL_ID}`)
      .forEach(c => supabase.removeChannel(c));

    const channel = supabase
      .channel(CHANNEL_ID)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_orders' },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { count, loading };
};