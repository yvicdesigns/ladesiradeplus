import { useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useRealtimeWithFallback } from './useRealtimeWithFallback';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useOrders = (options = {}) => {
  const { user } = useAuth();
  
  const fetchOrdersData = useCallback(async () => {
    if (!user && !options.admin) return [];
    
    let query = supabase.from('orders')
      .select('*, order_items(*, menu_items(name, image_url))')
      .is('is_deleted', false)
      .order('created_at', { ascending: false });
      
    if (!options.admin && user) {
      query = query.eq('user_id', user.id);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }, [user, options.admin]);

  const { data, loading, error, connectionStatus, isUsingFallback, refetch } = useRealtimeWithFallback({
    key: 'orders_list',
    channelName: 'public-orders',
    table: 'orders',
    fetchData: fetchOrdersData,
    pollingInterval: 2000,
    enabled: !!user || !!options.admin
  });

  return { 
    orders: data || [], 
    loading, 
    error,
    connectionStatus,
    isUsingFallback,
    refetch 
  };
};