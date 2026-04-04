import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { logger } from '@/lib/logger';
import { withTimeout, retryWithExponentialBackoff } from '@/lib/networkResilience';
import { TIMEOUT_CONFIG } from '@/lib/timeoutConfig';

const DEFAULT_RESTAURANT_ID = '7eedf081-0268-4867-af38-61fa5932420a';

export function useClients(filters = {}, page = 1, limit = 50) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);

  const isMounted = useRef(true);

  const fetchClients = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const fetchOp = async () => {
        let query = supabase
          .from('customers')
          .select('*', { count: 'exact' })
          .or('is_deleted.eq.false,is_deleted.is.null');
        
        if (filters && filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
        }
        
        if (limit === 'all') {
          query = query.order('name', { ascending: true }).limit(1000);
        } else {
          const safePage = Math.max(1, page || 1);
          const safeLimit = Math.max(1, limit || 50);
          const from = (safePage - 1) * safeLimit;
          const to = from + safeLimit - 1;
          query = query.order('created_at', { ascending: false }).range(from, to);
        }

        const { data, count, error: fetchError } = await query;
        if (fetchError) throw fetchError;
        return { data, count };
      };

      const result = await retryWithExponentialBackoff(async () => {
        return await withTimeout(fetchOp, TIMEOUT_CONFIG.QUERY_TIMEOUT);
      });

      if (!result.success) throw result.error;

      if (isMounted.current) {
        const safeData = Array.isArray(result.data.data) ? result.data.data : [];
        setClients(safeData);
        setTotalCount(result.data.count || safeData.length);
        setError(null);
      }
    } catch (err) {
      logger.error('Error fetching clients:', err);
      if (isMounted.current) {
        setError(err);
        setClients([]);
        setTotalCount(0);
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [filters?.search, page, limit]);

  useEffect(() => {
    isMounted.current = true;
    fetchClients();
    return () => { isMounted.current = false; };
  }, [fetchClients]);

  const createClient = async (clientData) => {
    try {
      const dataToInsert = { ...clientData, restaurant_id: DEFAULT_RESTAURANT_ID };
      const { data, error } = await supabase.from('customers').insert([dataToInsert]).select().single();
      if (error) throw error;
      await fetchClients();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const updateClient = async (id, clientData) => {
    try {
      const { data, error } = await supabase.from('customers').update(clientData).eq('id', id).select().single();
      if (error) throw error;
      await fetchClients();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const deleteClient = async (id) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);
        
      if (error) throw error;
      await fetchClients();
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  return {
    clients, loading, error, totalCount, refresh: fetchClients, createClient, updateClient, deleteClient
  };
}