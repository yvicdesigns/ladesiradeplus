import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

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

    const channel = supabase
      .channel('restaurant_orders_count')
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