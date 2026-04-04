import { useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useRealtimeWithFallback } from './useRealtimeWithFallback';

export const SINGLE_RESTAURANT_ID = '7eedf081-0268-4867-af38-61fa5932420a';

export const useMenu = (options = {}) => {
  const fetchMenuData = useCallback(async () => {
    let query = supabase.from('menu_items')
      .select('*, menu_categories(name)')
      .eq('is_deleted', false)
      .eq('restaurant_id', SINGLE_RESTAURANT_ID);
      
    if (options.filter) {
      Object.entries(options.filter).forEach(([k, v]) => {
        query = query.eq(k, v);
      });
    }
    
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    
    return data.map(item => ({
      ...item,
      is_available: item.stock_quantity > 0 && !item.is_deleted
    }));
  }, [JSON.stringify(options.filter)]);

  const { data, loading, error, connectionStatus, isUsingFallback, refetch } = useRealtimeWithFallback({
    key: 'menu_items',
    channelName: 'public-menu-items',
    table: 'menu_items',
    fetchData: fetchMenuData,
    pollingInterval: 3000
  });

  return { 
    items: data || [], 
    loading, 
    error,
    connectionStatus,
    isUsingFallback,
    refetch 
  };
};