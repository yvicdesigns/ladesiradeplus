import { useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useRealtimeWithFallback } from './useRealtimeWithFallback';
import { useRestaurant } from '@/contexts/RestaurantContext';

export const useMenu = (options = {}) => {
  const { restaurantId } = useRestaurant();

  const fetchMenuData = useCallback(async () => {
    if (!restaurantId) return [];

    let query = supabase.from('menu_items')
      .select('*, menu_categories(name)')
      .eq('is_deleted', false)
      .eq('restaurant_id', restaurantId);

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
      is_available: !item.is_deleted && item.is_available !== false && (item.stock_quantity === null || item.stock_quantity > 0)
    }));
  }, [JSON.stringify(options.filter), restaurantId]);

  const { data, loading, error, connectionStatus, isUsingFallback, refetch } = useRealtimeWithFallback({
    key: 'menu_items',
    channelName: 'public-menu-items',
    table: 'menu_items',
    fetchData: fetchMenuData,
    pollingInterval: 300000
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