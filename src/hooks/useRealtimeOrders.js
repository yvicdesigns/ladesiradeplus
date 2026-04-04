import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { getFromCache, setInCache } from '@/lib/cacheUtils';
import { applyIsDeletedFilter } from '@/lib/softDeleteUtils';
import { logSupabaseError } from '@/lib/supabaseErrorHandler';
import { retryWithExponentialBackoff, withTimeout } from '@/lib/networkResilience';
import { handleTokenRefreshError } from '@/lib/tokenRefreshHandler';
import { logger } from '@/lib/logger';
import { useRealtimeWithFallback, CONNECTION_STATUS } from './useRealtimeWithFallback';

const FETCH_TIMEOUT_MS = 20000;

export function useRealtimeOrders(
  initialFilters = {}, 
  initialPage = 1, 
  initialLimit = 50,
  initialSortBy = 'created_at', 
  initialSortOrder = 'desc',
  initialSearchQuery = '',
  skipRealtime = false // Task 2: Flag to completely disable realtime connections
) {
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true); 
  
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  const filtersRef = useRef({ ...initialFilters });
  const isMounted = useRef(true);
  const isFetchingRef = useRef(false);
  const ordersLengthRef = useRef(0);
  
  useEffect(() => {
    filtersRef.current = initialFilters;
  }, [initialFilters]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    ordersLengthRef.current = orders.length;
  }, [orders]);

  const fetchOrders = useCallback(async (
    currPage = page, 
    currLimit = limit, 
    currSortBy = sortBy, 
    currSortOrder = sortOrder, 
    currSearch = searchQuery, 
    isSilent = false 
  ) => {
    if (!isMounted.current || isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    
    if (!isSilent) {
      setLoading(true);
    }
    
    const cacheKey = `orders_${currPage}_${currLimit}_${currSortBy}_${currSortOrder}_${currSearch}_${JSON.stringify(filtersRef.current)}`;
    const cached = getFromCache(cacheKey);
    
    if (cached && ordersLengthRef.current === 0) {
      setOrders(cached.orders);
      setTotalCount(cached.totalCount);
    }

    try {
      const result = await retryWithExponentialBackoff(async () => {
        const applyFilters = (query) => {
          if (filtersRef.current.userId) query = query.eq('user_id', filtersRef.current.userId);
          if (filtersRef.current.status) query = query.eq('status', filtersRef.current.status);
          if (filtersRef.current.order_method) query = query.eq('order_method', filtersRef.current.order_method);
          query = applyIsDeletedFilter(query, filtersRef.current.includeDeleted ?? false);
          
          if (currSearch) {
            const searchCondition = `id.ilike.%${currSearch}%,customer_name.ilike.%${currSearch}%,customer_email.ilike.%${currSearch}%,status.ilike.%${currSearch}%`;
            query = query.or(searchCondition);
          }
          return query;
        };

        let countQuery = supabase.from('orders').select('id', { count: 'exact', head: true });
        countQuery = applyFilters(countQuery);
        const { count, error: countError } = await withTimeout(countQuery, FETCH_TIMEOUT_MS);
        
        if (countError) {
          const { shouldRedirect } = await handleTokenRefreshError(countError);
          if (shouldRedirect) throw new Error("session_expired");
          throw countError;
        }

        const from = (currPage - 1) * currLimit;
        const to = from + currLimit - 1;

        let dataQuery = supabase
          .from('orders')
          .select('*, order_items(*, menu_items(name)), tables(id, table_number), delivery_orders(*)')
          .order(currSortBy, { ascending: currSortOrder === 'asc' })
          .range(from, to); 

        dataQuery = applyFilters(dataQuery);
        const { data, error } = await withTimeout(dataQuery, FETCH_TIMEOUT_MS); 
        
        if (error) {
           const { shouldRedirect } = await handleTokenRefreshError(error);
           if (shouldRedirect) throw new Error("session_expired");
           throw error;
        }
        
        return { data, count };
      }, 2, 1000);

      if (!result.success) throw result.error;
      
      if (isMounted.current) {
        const newOrders = Array.isArray(result.data.data) ? result.data.data : [];
        setOrders(newOrders);
        setTotalCount(result.data.count ?? 0);
        setInCache(cacheKey, { orders: newOrders, totalCount: result.data.count ?? 0 }, 5);
        setLoading(false); 
      }
    } catch (err) {
      logSupabaseError(err, 'useRealtimeOrders fetchOrders');
      if (isMounted.current) {
        setLoading(false); 
      }
    } finally {
      if (isMounted.current) {
        isFetchingRef.current = false;
      }
    }
  }, [page, limit, sortBy, sortOrder, searchQuery]); 

  // Task 2: Pass enabled flag based on skipRealtime
  const {
    connectionStatus,
    lastUpdate,
    lastError,
    reconnect,
    isPolling
  } = useRealtimeWithFallback({
    channelName: 'orders-channel',
    table: 'orders',
    onUpdate: () => fetchOrders(page, limit, sortBy, sortOrder, searchQuery, true), 
    fetchData: () => fetchOrders(page, limit, sortBy, sortOrder, searchQuery, true), 
    pollingInterval: 120000, // Updated to 2 minutes
    maxRetries: 4,
    enabled: !skipRealtime
  });

  useEffect(() => {
    fetchOrders(page, limit, sortBy, sortOrder, searchQuery, false);
  }, [page, limit, sortBy, sortOrder, searchQuery, fetchOrders]);

  return { 
    orders: Array.isArray(orders) ? orders : [], 
    loading, 
    isConnected: connectionStatus === CONNECTION_STATUS.REALTIME, 
    connectionState: connectionStatus,
    lastUpdated: lastUpdate,
    connectionError: lastError?.message || null, 
    lastError,
    refresh: () => {
      isFetchingRef.current = false;
      fetchOrders(page, limit, sortBy, sortOrder, searchQuery, false); 
    },
    retryConnection: reconnect,
    isPolling,
    sortBy, sortOrder,
    setSort: (column, order) => { setSortBy(column); setSortOrder(order); setPage(1); },
    searchQuery, setSearchQuery,
    pagination: {
      currentPage: page, itemsPerPage: limit, totalCount, totalPages: Math.ceil((totalCount || 0) / limit) || 1,
      setPage, setLimit, hasNextPage: page * limit < (totalCount || 0), hasPreviousPage: page > 1
    }
  };
}