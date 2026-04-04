import { useState, useEffect, useCallback } from 'react';
import { deliveryService } from './deliveryService';
import { supabase } from '@/lib/customSupabaseClient';

export default function useDeliveryOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('delivery_orders')
      .select('*, orders(*)')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
      
    if (data) setOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('delivery_orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_orders' }, fetchOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const updateStatus = async (id, status) => {
    await deliveryService.updateDeliveryStatus(id, status);
  };

  return { orders, loading, refetch: fetchOrders, updateStatus };
}