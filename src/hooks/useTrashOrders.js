import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export function useTrashOrders(page = 1, limit = 50) {
  const [deletedOrders, setDeletedOrders] = useState([]);
  const [deletedReservations, setDeletedReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ totalCount: 0, ordersCount: 0, reservationsCount: 0, totalPages: 1, setPage: () => {}, setLimit: () => {} });

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch soft-deleted orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, tables(table_number)')
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false });

      // Fetch soft-deleted restaurant orders
      const { data: restOrdersData, error: restError } = await supabase
        .from('restaurant_orders')
        .select('*, orders(*)')
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false });

      if (ordersError) throw ordersError;
      if (restError) throw restError;

      const combinedOrders = [
        ...(ordersData || []).map(o => ({ ...o, source_table: 'orders', ui_type: o.type || 'history' })),
        ...(restOrdersData || []).map(ro => ({ ...ro, ...ro.orders, id: ro.id, source_table: 'restaurant_orders', ui_type: 'restaurant' }))
      ];

      setDeletedOrders(combinedOrders);
      setPagination(p => ({ ...p, ordersCount: combinedOrders.length, totalCount: combinedOrders.length }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery]);

  useEffect(() => { fetchTrash(); }, [fetchTrash]);

  return { deletedOrders, deletedReservations, loading, error, pagination, refresh: fetchTrash, searchQuery, setSearchQuery };
}