import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { fetchWithTimeout } from '@/lib/timeoutUtils';
import { TIMEOUT_CONFIG } from '@/lib/timeoutConfig';

export function useDeliveryOrdersWithRetry({ filters = {}, sort = { column: 'created_at', order: 'desc' }, page = 1, limit = 50, includeDeleted = false }) {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isMounted = useRef(true);

  const fetchOrders = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(prev => prev && orders.length === 0);

    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      let query = supabase.from('delivery_orders').select(`
        *,
        orders:order_id (
          id, customer_name, customer_phone, delivery_address, total, status, type, is_deleted,
          order_items (id, quantity, price, menu_items(name))
        ),
        delivery_zones!delivery_orders_zone_id_fkey(id, name, delivery_fee),
        customers:customer_id (id, name, phone)
      `, { count: 'exact' });

      if (!includeDeleted) {
        query = query.not('is_deleted', 'eq', true);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      query = query.order(sort.column, { ascending: sort.order === 'asc' }).range(from, to);

      const { data, count, error: err } = await fetchWithTimeout(query, TIMEOUT_CONFIG.FETCH_TIMEOUT);
      
      if (err) throw err;

      if (isMounted.current) {
        setOrders(data || []);
        setPagination({
          totalCount: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        });
        setError(null);
      }
    } catch (err) {
      if (isMounted.current) {
        console.error("useDeliveryOrdersWithRetry fetch error:", err);
        setError(err);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [page, limit, filters, sort, includeDeleted, orders.length]);

  useEffect(() => {
    isMounted.current = true;
    fetchOrders();
    return () => { isMounted.current = false; };
  }, [fetchOrders]);

  return { orders, loading, error, pagination, refresh: fetchOrders };
}