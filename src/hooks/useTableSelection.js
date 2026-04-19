import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { handleSingleQueryError } from '@/lib/supabaseErrorHandler';

export const useTableSelection = (restaurantId) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTables = async () => {
      if (!restaurantId) {
        // restaurantId not yet available — keep loading, don't error
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tables')
          .select('id, table_number, capacity, restaurant_id')
          .eq('restaurant_id', restaurantId)
          .or('is_deleted.eq.false,is_deleted.is.null')
          .order('table_number');
          
        if (error) throw error;
        
        const validTables = (data || []).filter(t => t.restaurant_id === restaurantId);
        setTables(validTables);
      } catch (err) {
        console.error('[useTableSelection] Error fetching tables:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, [restaurantId]);

  const getTableNumber = useCallback((tableId) => {
    if (!tableId) return null;
    const table = tables.find(t => t.id === tableId);
    return table ? table.table_number : null;
  }, [tables]);

  const fetchSingleTable = useCallback(async (tableNumber) => {
    if (!tableNumber || !restaurantId) {
      return { table: null, error: 'Numéro de table ou restaurant manquant', loading: false };
    }
    
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('table_number', tableNumber)
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      if (error) {
        const handledError = handleSingleQueryError(error);
        if (handledError) throw new Error(handledError.message);
        throw error;
      }

      if (!data) {
        return { table: null, error: 'Table not found', loading: false };
      }

      return { table: data, error: null, loading: false };
    } catch (err) {
      return { table: null, error: err.message, loading: false };
    }
  }, [restaurantId]);

  return { tables, loading, error, getTableNumber, fetchSingleTable };
};