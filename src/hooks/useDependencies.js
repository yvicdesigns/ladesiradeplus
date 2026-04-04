import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useDependencies = () => {
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkDependencies = useCallback(async (tableName, recordId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_dependencies', {
        p_table_name: tableName,
        p_record_id: recordId
      });

      if (rpcError) throw rpcError;
      
      setDependencies(data || []);
      return data || [];
    } catch (err) {
      console.error('[useDependencies] Error checking dependencies:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { dependencies, loading, error, checkDependencies };
};