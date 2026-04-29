import { RESTAURANT_ID } from '@/lib/adminSettingsUtils';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { fetchWithTimeout } from '@/lib/timeoutUtils';
import { TIMEOUT_CONFIG } from '@/lib/timeoutConfig';
import { applyIsDeletedFilter } from '@/lib/softDeleteUtils';
import { useRealtimeWithFallback, CONNECTION_STATUS } from './useRealtimeWithFallback';

export { CONNECTION_STATUS };

const TARGET_RESTAURANT_ID = RESTAURANT_ID;

export function useRealtimeRestaurantOrders({
  page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'desc', searchQuery = '', orderId = null, includeDeleted = false
} = {}) {
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isMounted = useRef(true);
  const fetchTimeoutRef = useRef(null);

  useEffect(() => {
    console.log('[useRealtimeRestaurantOrders] 1. Hook Initialized', { page, limit, includeDeleted });
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, [page, limit, includeDeleted]);

  const fetchOrders = useCallback(async () => {
    if (!isMounted.current) return;
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    setLoading(prev => prev && orders.length === 0);

    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      console.log(`[useRealtimeRestaurantOrders] 2. Fetching data... Params:`, { from, to, restaurantId: TARGET_RESTAURANT_ID, includeDeleted });

      // Ensure we select all necessary columns, including restaurant_id
      let query = supabase.from('restaurant_orders').select(`
        *,
        orders!inner (
          id, total, status, customer_name, table_id, type, created_at, is_deleted, order_method, restaurant_id,
          is_complimentary, complimentary_reason,
          tables ( table_number ),
          order_items ( id, quantity, price, notes, status, menu_item_id, menu_items ( name, image_url ) )
        )`, { count: 'exact' });

      // Apply critical filters
      query = query.eq('restaurant_id', TARGET_RESTAURANT_ID);
      
      // BUG FIX: Removed query.eq('orders.type', 'dine_in') because order type from checkout is often 'restaurant'
      // If we restrict to 'dine_in', valid restaurant orders created by the client are excluded.
      
      // Apply soft delete filter on the main table (restaurant_orders)
      query = applyIsDeletedFilter(query, includeDeleted, 'restaurant_orders');

      if (orderId) query = query.or(`id.eq.${orderId},order_id.eq.${orderId}`);
      if (searchQuery) query = query.textSearch('orders.customer_name', searchQuery, { config: 'english', type: 'plain' });

      if (!orderId) {
         query = query.order(sortBy === 'created_at' ? 'created_at' : sortBy, { ascending: sortOrder === 'asc' }).range(from, to);
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, count, error: err } = await fetchWithTimeout(query, TIMEOUT_CONFIG.FETCH_TIMEOUT);
      
      console.log('[useRealtimeRestaurantOrders] 3. Raw Supabase response:', { 
        success: !err,
        dataLength: data?.length || 0, 
        totalCount: count, 
        error: err 
      });

      if (err) throw err;

      if (isMounted.current) {
        const safeData = Array.isArray(data) ? data : [];
        let formattedData = safeData.map(ro => ({
          ...ro,
          table_number: ro?.orders?.tables?.table_number || 'N/A',
          customer_name: ro?.orders?.customer_name || 'Client',
          items: ro?.orders?.order_items || [],
          parent_status: ro?.orders?.status || 'pending',
          type: ro?.orders?.type || 'dine_in',
          order_method: ro?.orders?.order_method || 'online',
          total: ro?.orders?.total || 0,
          is_complimentary: ro?.orders?.is_complimentary || false,
          complimentary_reason: ro?.orders?.complimentary_reason || null,
        }));
        
        if (!includeDeleted) {
            formattedData = formattedData.filter(ro => !ro.orders?.is_deleted);
        }

        console.log('[useRealtimeRestaurantOrders] 4. Processed data ready:', formattedData.length, 'records');

        setOrders(formattedData);
        setTotalCount(count || 0);
        setError(null);
        setLoading(false);
      }
    } catch (err) {
      console.error('[useRealtimeRestaurantOrders] Error fetching orders:', err);
      if (isMounted.current) {
        setError(err.message || "Une erreur est survenue lors du chargement des commandes.");
        setLoading(false);
      }
    }
  }, [page, limit, sortBy, sortOrder, orderId, searchQuery, includeDeleted, orders.length]);

  const {
    connectionStatus,
    lastUpdate,
    lastError,
    reconnect,
    isPolling
  } = useRealtimeWithFallback({
    channelName: 'restaurant-orders-channel',
    table: 'restaurant_orders',
    onUpdate: fetchOrders,
    fetchData: fetchOrders,
    pollingInterval: 120000, // Updated to 2 minutes
    maxRetries: 3
  });

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (id, newStatus) => {
    try {
      if (!id) throw new Error("ID required");
      const { error: roError } = await supabase.from('restaurant_orders').update({ status: newStatus }).eq('id', id);
      if (roError) throw roError;
      
      const order = orders.find(o => o.id === id);
      if (order?.order_id) {
        await supabase.from('orders').update({ status: newStatus }).eq('id', order.order_id);
      }
      if (isMounted.current) fetchOrders();
      return { success: true };
    } catch (err) { 
      console.error('[useRealtimeRestaurantOrders] Update status error:', err);
      return { success: false, error: err.message || err }; 
    }
  };

  const updateItemStatus = async (itemId, newStatus) => {
      try {
          if (!itemId) throw new Error("Item ID required");
          const { error } = await supabase.from('order_items').update({ status: newStatus }).eq('id', itemId);
          if (error) throw error;
          if (isMounted.current) fetchOrders(); 
          return { success: true };
      } catch (err) { return { success: false, error: err.message || err }; }
  };
  
  const updatePaymentStatus = async (id, status) => {
      try {
        if (!id) throw new Error("ID required");
        const { error } = await supabase.from('restaurant_orders').update({ payment_status: status }).eq('id', id);
        if (error) throw error;
        if (isMounted.current) fetchOrders();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message || err };
      }
  };

  return { 
    orders, 
    loading, 
    error: error || lastError?.message, 
    connectionStatus, 
    lastUpdate,
    isPolling,
    updateStatus, 
    updateItemStatus, 
    updatePaymentStatus, 
    refresh: fetchOrders, 
    reconnect, 
    pagination: { currentPage: page, itemsPerPage: limit, totalCount, totalPages: Math.ceil(totalCount / limit) } 
  };
}