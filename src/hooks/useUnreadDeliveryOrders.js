import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useUnreadDeliveryOrders = () => {
  const [counts, setCounts] = useState({
    deliveryUnread: 0,
    restaurantUnread: 0,
    totalUnread: 0
  });
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

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

  useEffect(() => {
    isMounted.current = true;
    fetchUnreadCounts();

    // Use unique channel name to avoid conflicts with multiple sidebar instances
    const channel = supabase
      .channel(`unread-counts-sync-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_orders' }, () => {
        fetchUnreadCounts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_orders' }, () => {
        fetchUnreadCounts();
      })
      .subscribe();

    return () => {
      isMounted.current = false;
      supabase.removeChannel(channel);
    };
  }, [fetchUnreadCounts]);

  return { ...counts, loading };
};