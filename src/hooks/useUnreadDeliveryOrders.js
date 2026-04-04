import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { executeWithResilience } from '@/lib/supabaseErrorHandler';

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
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔍 useUnreadDeliveryOrders: Starting fetch...`);

    try {
      const results = await executeWithResilience(async () => {
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
        
        if (deliveryResult.error) throw deliveryResult.error;
        if (restaurantResult.error) throw restaurantResult.error;
        
        return {
          deliveryCount: deliveryResult.count || 0,
          restaurantCount: restaurantResult.count || 0
        };
      }, { context: 'Fetch Unread Counts', retry: true, maxRetries: 2 });

      if (isMounted.current) {
        setCounts({
          deliveryUnread: results.deliveryCount,
          restaurantUnread: results.restaurantCount,
          totalUnread: results.deliveryCount + results.restaurantCount
        });
        setLoading(false);
      }
    } catch (err) {
      console.error(`[${timestamp}] 💥 Exception in useUnreadDeliveryOrders:`, err);
      if (isMounted.current) {
        setCounts({ deliveryUnread: 0, restaurantUnread: 0, totalUnread: 0 });
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    
    fetchUnreadCounts();

    const channel = supabase
      .channel('unread-counts-sync')
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