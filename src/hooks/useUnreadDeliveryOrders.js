import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

// Stable ID generated once per module load — never changes across re-renders
const CHANNEL_ID = `unread-counts-${Math.random().toString(36).slice(2)}`;

export const useUnreadDeliveryOrders = () => {
  const [counts, setCounts] = useState({
    deliveryUnread: 0,
    restaurantUnread: 0,
    totalUnread: 0
  });
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  // Keep a ref to the fetch fn so the effect never needs it as a dep
  const fetchRef = useRef(null);

  const fetchUnreadCounts = useCallback(async () => {
    if (!isMounted.current) return;
    try {
      const [deliveryResult, restaurantResult] = await Promise.all([
        supabase
          .from('delivery_orders')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'in_transit'])
          .eq('is_deleted', false),
        supabase
          .from('restaurant_orders')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'new'])
          .eq('is_deleted', false)
      ]);

      if (!isMounted.current) return;
      const deliveryCount = deliveryResult.error ? 0 : (deliveryResult.count || 0);
      const restaurantCount = restaurantResult.error ? 0 : (restaurantResult.count || 0);
      setCounts({
        deliveryUnread: deliveryCount,
        restaurantUnread: restaurantCount,
        totalUnread: deliveryCount + restaurantCount
      });
      setLoading(false);
    } catch (err) {
      console.error('useUnreadDeliveryOrders fetch error:', err);
      if (isMounted.current) setLoading(false);
    }
  }, []);

  fetchRef.current = fetchUnreadCounts;

  useEffect(() => {
    isMounted.current = true;
    fetchRef.current?.();

    // Remove any stale channel with this ID before subscribing
    supabase.getChannels()
      .filter(c => c.topic === `realtime:${CHANNEL_ID}`)
      .forEach(c => supabase.removeChannel(c));

    const channel = supabase
      .channel(CHANNEL_ID)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_orders' }, () => {
        fetchRef.current?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_orders' }, () => {
        fetchRef.current?.();
      })
      .subscribe();

    return () => {
      isMounted.current = false;
      supabase.removeChannel(channel);
    };
  }, []); // empty deps — channel created once, never recreated

  return { ...counts, loading };
};