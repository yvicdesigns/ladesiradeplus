import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { logger } from '@/lib/logger';

export const useRealtimeDeliveryOrders = (options = {}) => {
  // Support both legacy numeric limit and options object
  const initialLimit = typeof options === 'number' ? options : (options.limit || 50);
  const orderId = typeof options === 'object' ? options.orderId : null;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();

  const [pagination, setPagination] = useState({
    page: 1,
    limit: initialLimit,
    totalPages: 1,
    totalCount: 0
  });

  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    showDeleted: false
  });

  const fetchOrders = useCallback(async () => {
    // When tracking a specific order (customer mode), restaurantId is not required
    if (!orderId && !restaurantId) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('delivery_orders')
        .select(`
          *,
          orders:order_id (
            id, total, status, type, created_at, customer_name, customer_phone, delivery_address, is_deleted,
            order_items (
              id, quantity, price,
              menu_items (name)
            )
          )
        `, { count: 'exact' });

      // If a specific order ID is requested, filter by it (customer tracking mode — no restaurantId needed)
      if (orderId) {
        query = query.eq('order_id', orderId);
      } else {
        // Admin mode: filter by restaurant
        query = query.eq('restaurant_id', restaurantId);
        // Apply Filters (only when not tracking a specific order)
        if (filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        if (!filters.showDeleted) {
          query = query.or('is_deleted.eq.false,is_deleted.is.null');
        }

        if (filters.search) {
          query = query.or(`id.eq.${filters.search},order_id.eq.${filters.search}`);
        }
      }

      // Pagination
      const safeLimit = Number.isFinite(pagination.limit) ? pagination.limit : 50;
      const safePage = Number.isFinite(pagination.page) ? pagination.page : 1;
      const from = (safePage - 1) * safeLimit;
      const to = from + safeLimit - 1;

      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, count, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Ensure data maps properly for UI (pulling up order total as fallback)
      const mappedData = (data || []).map(doItem => ({
        ...doItem,
        total: doItem.total || doItem.orders?.total || 0,
        customer_name: doItem.orders?.customer_name || 'Inconnu',
        delivery_address: doItem.orders?.delivery_address || doItem.delivery_address,
        is_deleted: doItem.is_deleted || doItem.orders?.is_deleted || false,
        // Hoist order_items from the nested orders relation so tracking page can access them directly
        order_items: doItem.orders?.order_items || []
      }));

      setOrders(mappedData);
      setPagination(prev => ({
        ...prev,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / prev.limit)
      }));

    } catch (err) {
      logger.error('Error fetching delivery orders:', err);
      setError(err);
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de récupérer les commandes de livraison."
      });
    } finally {
      setLoading(false);
    }
  }, [restaurantId, orderId, filters, pagination.page, pagination.limit, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!orderId && !restaurantId) return;

    const channelFilter = orderId
      ? `order_id=eq.${orderId}`
      : `restaurant_id=eq.${restaurantId}`;

    const channel = supabase.channel(`delivery_orders_changes_${orderId || restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_orders',
          filter: channelFilter
        },
        () => { fetchOrders(); }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnectionStatus('realtime');
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setConnectionStatus('polling');
      });

    // Polling de secours toutes les 10s si on est en mode tracking client
    let pollInterval = null;
    if (orderId) {
      pollInterval = setInterval(() => {
        fetchOrders();
      }, 10000);
    }

    return () => {
      supabase.removeChannel(channel);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [restaurantId, orderId, fetchOrders]);

  return {
    orders,
    loading,
    error,
    connectionStatus,
    refresh: fetchOrders,
    retry: fetchOrders,
    reconnect: () => fetchOrders(), // Simple wrapper for now
    pagination: {
      ...pagination,
      setPage: (page) => setPagination(p => ({ ...p, page })),
      setLimit: (limit) => setPagination(p => ({ ...p, limit, page: 1 }))
    },
    filters,
    setFilters: (newFilters) => {
      setFilters(prev => ({ ...prev, ...newFilters }));
      setPagination(p => ({ ...p, page: 1 }));
    }
  };
};