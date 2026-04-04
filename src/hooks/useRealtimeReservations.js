import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { emailService } from '@/lib/emailService';
import { logger } from '@/lib/logger';
import { fetchWithTimeout } from '@/lib/timeoutUtils';
import { TIMEOUT_CONFIG } from '@/lib/timeoutConfig';
import { applyIsDeletedFilter } from '@/lib/softDeleteUtils';
import { handleTokenRefreshError } from '@/lib/tokenRefreshHandler';
import { useRealtimeWithFallback, CONNECTION_STATUS } from './useRealtimeWithFallback';

export { CONNECTION_STATUS };

export const useRealtimeReservations = (
  initialPage = 1, 
  initialLimit = 50,
  initialSortBy = 'reservation_date',
  initialSortOrder = 'desc',
  initialSearchQuery = '',
  includeDeleted = false
) => {
  const [reservations, setReservations] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  
  const fetchTimeoutRef = useRef(null);
  const isMounted = useRef(true);

  const fetchReservations = useCallback(async () => {
    if (!isMounted.current) return;
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    if (reservations.length === 0) setLoading(true);

    try {
      let query = supabase
        .from('reservations')
        .select('*, tables(id, table_number, location, capacity)', { count: 'exact' });

      query = applyIsDeletedFilter(query, includeDeleted);

      if (searchQuery) {
        query = query.or(`customer_name.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%,id.ilike.%${searchQuery}%`);
      }

      const validSortColumns = ['id', 'created_at', 'reservation_date', 'reservation_time', 'party_size', 'status', 'customer_name'];
      const actualSortBy = validSortColumns.includes(sortBy) ? sortBy : 'reservation_date';
      
      query = query.order(actualSortBy, { ascending: sortOrder === 'asc' });
      if (actualSortBy !== 'created_at') {
        query = query.order('created_at', { ascending: false });
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, count, error: fetchError } = await fetchWithTimeout(query, TIMEOUT_CONFIG.FETCH_TIMEOUT, "Délai d'attente dépassé pour les réservations");

      if (fetchError) {
         const { shouldRedirect } = await handleTokenRefreshError(fetchError);
         if (shouldRedirect) throw new Error("session_expired");
         throw fetchError;
      }

      if (isMounted.current) {
        setReservations(Array.isArray(data) ? data : []);
        setTotalCount(count ?? 0);
        setError(null);
      }
    } catch (err) {
      logger.error('[Reservations] Fetch error:', err);
      if (isMounted.current) setError(err.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, searchQuery, reservations.length, includeDeleted]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, []);

  const {
    connectionStatus,
    lastUpdate,
    lastError,
    reconnect,
    isPolling
  } = useRealtimeWithFallback({
    channelName: 'reservations-admin',
    table: 'reservations',
    onUpdate: fetchReservations, // In a robust implementation, we might parse the event payload to send emails, but fetching ensures consistency.
    fetchData: fetchReservations,
    pollingInterval: 120000, // Updated to 2 minutes
    maxRetries: 3
  });

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]); 

  const updateReservationStatus = async (id, status) => {
    const { error: updateError } = await supabase.from('reservations').update({ status }).eq('id', id);
    if (updateError) {
        const { shouldRedirect } = await handleTokenRefreshError(updateError);
        if (shouldRedirect) throw new Error("session_expired");
        throw updateError;
    }
    fetchReservations();
    return true;
  };

  return {
    reservations: Array.isArray(reservations) ? reservations : [], 
    totalCount: totalCount ?? 0, 
    loading, 
    error: error || lastError?.message, 
    connectionStatus, 
    lastUpdate, 
    isPolling,
    reconnect,
    refresh: fetchReservations,
    updateReservationStatus,
    pagination: {
      currentPage: page, itemsPerPage: limit, totalCount: totalCount ?? 0, totalPages: Math.ceil((totalCount ?? 0) / limit) || 1,
      setPage, setLimit, hasNextPage: page * limit < (totalCount ?? 0), hasPreviousPage: page > 1
    },
    sortBy, sortOrder,
    setSort: (c, o) => { setSortBy(c); setSortOrder(o); setPage(1); },
    searchQuery, setSearchQuery: (q) => { setSearchQuery(q); setPage(1); }
  };
};