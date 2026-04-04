import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { ordersService } from '../services/ordersService';

export function useTrackOrder(orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const data = await ordersService.fetchOrderById(orderId);
      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();

    if (!orderId) return;

    const channel = supabase.channel(`public:orders:id=eq.${orderId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        setOrder(prev => prev ? { ...prev, ...payload.new } : null);
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'delivery_orders',
        filter: `order_id=eq.${orderId}`
      }, () => {
        fetchOrder(); // Deep fetch to get nested relations
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrder, orderId]);

  return { 
    order, 
    status: order?.status, 
    deliveryInfo: order?.delivery_orders?.[0] || null, 
    loading, 
    error,
    refetch: fetchOrder
  };
}