import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { ordersService } from '../services/ordersService';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export function useOrders(filters = {}) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const limit = filters.limit || 20;
      const { orders: data, count } = await ordersService.fetchUserOrders(user.id, { ...filters, limit });
      setOrders(data || []);
      setHasMore((data?.length || 0) < count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, filters.status, filters.type, filters.limit]);

  // Refetch whenever the user or filters change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Keep a ref to the latest fetch fn so the channel effect never needs it as
  // a dependency — fetchOrders changes whenever filters change, which would
  // otherwise tear down and recreate the subscription unnecessarily.
  const fetchOrdersRef = useRef(fetchOrders);
  fetchOrdersRef.current = fetchOrders;

  // Realtime subscription — tied only to the user's actual identity
  useEffect(() => {
    if (!user) return;

    const channelName = `public:orders:user_id=eq.${user.id}`;
    let channel;

    try {
      channel = supabase.channel(channelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchOrdersRef.current(); // Refetch on any change to user's orders
        })
        .subscribe();
    } catch (e) {
      // Channel already exists from a previous render — remove and recreate
      supabase.getChannels()
        .filter(c => c.topic === `realtime:${channelName}`)
        .forEach(c => supabase.removeChannel(c));
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return { orders, loading, error, refetch: fetchOrders, hasMore };
}