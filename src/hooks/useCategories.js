import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { getValidatedRestaurantId } from '@/lib/restaurantValidation';

export const useCategories = (options = {}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  
  const { restaurantId } = useRestaurant();

  const fetchCategories = useCallback(async () => {
    if (!isMounted.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const validRestaurantId = getValidatedRestaurantId(restaurantId);

      let query = supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', validRestaurantId)
        .or('is_deleted.eq.false,is_deleted.is.null');
      
      if (options?.orderBy) {
         query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
      } else {
         query = query.order('display_order', { ascending: true });
      }
      
      const { data, error: qError } = await query;
      if (qError) throw qError;
      
      if (isMounted.current) {
        setCategories(Array.isArray(data) ? data : []);
        setError(null);
      }
    } catch (err) {
      console.error('[useCategories] Error fetching categories:', err);
      if (isMounted.current) {
        setError(err);
        setCategories([]);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [options?.orderBy?.column, options?.orderBy?.ascending, restaurantId]);

  useEffect(() => {
    isMounted.current = true;
    fetchCategories();
    return () => {
      isMounted.current = false;
    };
  }, [fetchCategories]);

  return { 
    categories, 
    loading, 
    error,
    refetch: fetchCategories 
  };
};