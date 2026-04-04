import { useState, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    fetchOrders();

    if (!user) return;

    const channel = supabase.channel(`public:orders:user_id=eq.${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchOrders(); // Refetch on any change to user's orders
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, user]);

  return { orders, loading, error, refetch: fetchOrders, hasMore };
}