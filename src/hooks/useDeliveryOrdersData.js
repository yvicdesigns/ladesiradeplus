import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { fetchWithTimeout } from '@/lib/timeoutUtils';
import { categorizeError, getFriendlyErrorMessage, SupabaseErrorTypes } from '@/lib/supabaseErrorHandler';
import { TIMEOUT_CONFIG } from '@/lib/timeoutConfig';

export function useDeliveryOrdersData(initialFilters = {}, initialPage = 1, initialLimit = 50) {
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    showDeleted: false,
    ...initialFilters
  });
  const [sort, setSort] = useState({ column: 'created_at', order: 'desc' });

  const isMounted = useRef(true);
  const fetchTimeoutRef = useRef(null);
  const retryCount = useRef(0);
  const isFetching = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, []);

  const fetchOrders = useCallback(async (forceRefresh = false) => {
    if (!isMounted.current || isFetching.current) return;
    
    isFetching.current = true;
    if (forceRefresh || orders.length === 0) setLoading(true);
    setError(null);

    // Removed local caching completely to prevent displaying stale or fake mock data
    
    try {
      let query = supabase
        .from('orders')
        .select(`
          id, created_at, customer_name, delivery_address, total, status, is_deleted, type,
          delivery_orders (id, payment_method, payment_status),
          order_items (id, quantity, price)
        `, { count: 'exact' })
        .eq('type', 'delivery'); // Ensuring we only get real delivery orders from DB

      if (filters.showDeleted) {
        query = query.eq('is_deleted', true);
      } else {
        query = query.not('is_deleted', 'eq', true);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.search) {
        query = query.or(`customer_name.ilike.%${filters.search}%,id.ilike.%${filters.search}%`);
      }

      query = query.order(sort.column, { ascending: sort.order === 'asc' });

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, count, error: fetchError } = await fetchWithTimeout(query, TIMEOUT_CONFIG.FETCH_TIMEOUT, "Délai d'attente dépassé");

      if (fetchError) throw fetchError;

      if (isMounted.current) {
        setOrders(data || []);
        setTotalCount(count || 0);
        retryCount.current = 0;
        setError(null);
      }
    } catch (err) {
      if (isMounted.current) {
        const errorType = categorizeError(err);
        const friendlyMessage = getFriendlyErrorMessage(err, "Chargement des commandes");
        setError({ message: friendlyMessage, type: errorType, original: err });
        
        if ((errorType === SupabaseErrorTypes.NETWORK || errorType === SupabaseErrorTypes.TIMEOUT) && retryCount.current < TIMEOUT_CONFIG.MAX_RETRIES) {
          retryCount.current++;
          const delay = TIMEOUT_CONFIG.RETRY_BACKOFF_BASE * Math.pow(2, retryCount.current - 1);
          console.warn(`Retrying fetch in ${delay}ms... (Attempt ${retryCount.current})`);
          
          fetchTimeoutRef.current = setTimeout(() => {
            if (isMounted.current) fetchOrders(true);
          }, delay);
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        isFetching.current = false;
      }
    }
  }, [page, limit, filters, sort, orders.length]);

  useEffect(() => {
    setPage(1); // Reset page on filter change
  }, [filters, sort.column, sort.order]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      fetchOrders(true);
      return { success: true };
    } catch (err) {
      return { success: false, error: getFriendlyErrorMessage(err) };
    }
  };

  return {
    orders,
    loading,
    error,
    totalCount,
    filters,
    setFilters,
    sort,
    setSort,
    pagination: {
      page,
      limit,
      setPage,
      setLimit,
      totalPages: Math.ceil(totalCount / limit)
    },
    refresh: () => { retryCount.current = 0; fetchOrders(true); },
    updateOrderStatus
  };
}