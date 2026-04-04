import { useState, useEffect, useCallback } from 'react';
import { kitchenService } from './kitchenService';
import { supabase } from '@/lib/customSupabaseClient';

export default function useKitchenOrders() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    const { data } = await kitchenService.getKitchenQueue();
    if (data) setQueue(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchQueue();
    
    const channel = supabase.channel('kitchen_queue_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchQueue)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_orders' }, fetchQueue)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchQueue]);

  const updateStatus = async (id, status) => {
    await kitchenService.updateOrderStatus(id, status);
  };

  return { queue, loading, refetch: fetchQueue, updateStatus };
}