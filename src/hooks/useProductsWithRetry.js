import { useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useRealtimeWithFallback } from './useRealtimeWithFallback';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { getValidatedRestaurantId } from '@/lib/restaurantValidation';

export function useProductsWithRetry(options = {}) {
  const { restaurantId } = useRestaurant();

  const fetchProductsAndCategories = useCallback(async () => {
    const validRestaurantId = getValidatedRestaurantId(restaurantId);

    const { data: catsData, error: catsError } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', validRestaurantId)
      .or('is_deleted.eq.false,is_deleted.is.null')
      .order('display_order', { ascending: true });
      
    if (catsError) throw catsError;

    let query = supabase
      .from('menu_items')
      .select('*, menu_categories(id, name, is_deleted)')
      .eq('restaurant_id', validRestaurantId)
      .or('is_deleted.eq.false,is_deleted.is.null')
      .order('created_at', { ascending: false });

    if (options?.categoryId && options.categoryId !== 'all') {
      query = query.eq('category_id', options.categoryId);
    }

    const { data: prodsData, error: prodsError } = await query;
    if (prodsError) throw prodsError;

    const processedProducts = (prodsData || []).map(item => ({
      ...item,
      // Available if: not deleted, not explicitly disabled, and has stock (or stock is null = unlimited)
      is_available: !item.is_deleted && item.is_available !== false && (item.stock_quantity === null || item.stock_quantity > 0)
    }));

    return { products: processedProducts, categories: catsData || [] };
  }, [options?.categoryId, restaurantId]);

  const { data, loading, error, connectionStatus, isUsingFallback, refetch } = useRealtimeWithFallback({
    key: `products_with_categories_${restaurantId}`,
    channelName: `public-products-cats-${restaurantId}`,
    table: 'menu_items', // Listen to menu_items as primary trigger
    fetchData: fetchProductsAndCategories,
    pollingInterval: 300000
  });

  return { 
    products: data?.products || [], 
    categories: data?.categories || [],
    loading, 
    error, 
    connectionStatus,
    isUsingFallback,
    retryCount: isUsingFallback ? 1 : 0,
    isRetrying: connectionStatus === 'connecting',
    retry: refetch,
    refresh: refetch
  };
}