import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  REALTIME: 'realtime',
  POLLING: 'polling',
  DISCONNECTED: 'disconnected',
  ERROR: 'error'
};

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
  const [connectionStatus, setConnectionStatus] = useState(CONNECTION_STATUS.CONNECTING);

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchReservations = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      let query = supabase
        .from('reservations')
        .select('*', { count: 'exact' })
        .not('is_deleted', 'is', true);

      if (searchQuery) {
        query = query.or(`customer_name.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%`);
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

      const { data, count, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (isMounted.current) {
        setReservations(Array.isArray(data) ? data : []);
        setTotalCount(count ?? 0);
        setError(null);
        setConnectionStatus(CONNECTION_STATUS.REALTIME);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.message);
        setConnectionStatus(CONNECTION_STATUS.ERROR);
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, searchQuery, includeDeleted]);

  // Fetch on mount and when deps change
  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('reservations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        fetchReservations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchReservations]);

  const updateReservationStatus = async (id, status) => {
    const { error: updateError } = await supabase.from('reservations').update({ status }).eq('id', id);
    if (updateError) throw updateError;
    fetchReservations();
    return true;
  };

  return {
    reservations,
    totalCount,
    loading,
    error,
    connectionStatus,
    lastUpdate: null,
    isPolling: false,
    reconnect: fetchReservations,
    refresh: fetchReservations,
    updateReservationStatus,
    pagination: {
      currentPage: page,
      itemsPerPage: limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
      setPage,
      setLimit,
      hasNextPage: page * limit < totalCount,
      hasPreviousPage: page > 1
    },
    sortBy, sortOrder,
    setSort: (c, o) => { setSortBy(c); setSortOrder(o); setPage(1); },
    searchQuery,
    setSearchQuery: (q) => { setSearchQuery(q); setPage(1); }
  };
};
