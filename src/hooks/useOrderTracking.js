import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useOrderTracking = (paramId) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [orderType, setOrderType] = useState(null);
  
  // Ref to track if we're currently fetching to prevent race conditions
  const isFetchingRef = useRef(false);

  const fetchOrder = useCallback(async (isSilent = false) => {
    if (!paramId) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (!isSilent) setLoading(true);
      setError(null);

      // 1. Try to find in delivery_orders first
      let { data: deliveryData, error: deliveryError } = await supabase
        .from('delivery_orders')
        .select(`
          *,
          orders:order_id (
            id, total, created_at, customer_name, customer_phone, delivery_address, type, status,
            order_items ( id, quantity, price, menu_items (name) )
          ),
          delivery_zones!delivery_orders_zone_id_fkey (name)
        `)
        .eq('id', paramId)
        .maybeSingle();

      if (!deliveryData) {
         // Try finding by parent order_id
         const { data: deliveryByOrderId } = await supabase
            .from('delivery_orders')
            .select(`
              *,
              orders:order_id (
                id, total, created_at, customer_name, customer_phone, delivery_address, type, status,
                order_items ( id, quantity, price, menu_items (name) )
              ),
              delivery_zones!delivery_orders_zone_id_fkey (name)
            `)
            .eq('order_id', paramId)
            .maybeSingle();
         
         if (deliveryByOrderId) deliveryData = deliveryByOrderId;
      }

      if (deliveryData) {
        const mergedOrder = {
          ...deliveryData,
          total: deliveryData.orders?.total,
          customer_name: deliveryData.orders?.customer_name,
          delivery_address: deliveryData.delivery_address || deliveryData.orders?.delivery_address,
          created_at: deliveryData.created_at,
          type: 'delivery',
          original_order_status: deliveryData.orders?.status,
          items: deliveryData.orders?.order_items
        };
        setOrder(mergedOrder);
        setOrderType('delivery');
        if (!isSilent) setLoading(false);
        return;
      }

      // 2. Check restaurant_orders
      const RESTAURANT_SELECT = `
          *,
          orders:order_id (
            id, total, created_at, customer_name, customer_phone, type, status, table_id,
            order_method,
            tables(table_number),
            order_items ( id, quantity, price, menu_items (name) )
          )
      `;

      let { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurant_orders')
        .select(RESTAURANT_SELECT)
        .eq('id', paramId)
        .maybeSingle();

      if (!restaurantData) {
          const { data: restaurantByOrderId } = await supabase
            .from('restaurant_orders')
            .select(RESTAURANT_SELECT)
            .eq('order_id', paramId)
            .maybeSingle();

          if (restaurantByOrderId) restaurantData = restaurantByOrderId;
      }

      if (restaurantData) {
          const mergedOrder = {
              ...restaurantData,
              total: restaurantData.orders?.total,
              customer_name: restaurantData.orders?.customer_name,
              table_number: restaurantData.orders?.tables?.table_number,
              order_method: restaurantData.orders?.order_method,
              created_at: restaurantData.created_at,
              type: 'restaurant',
              status: restaurantData.status || restaurantData.orders?.status,
              items: restaurantData.orders?.order_items
          };
          setOrder(mergedOrder);
          setOrderType('restaurant');
          if (!isSilent) setLoading(false);
          return;
      }

      // 3. Fallback: Check 'orders' table directly
      const { data: genericOrder, error: genericError } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                id, quantity, price, menu_items (name)
            ),
            tables (table_number)
        `)
        .eq('id', paramId)
        .maybeSingle();

      if (genericOrder) {
          const mergedOrder = {
              id: genericOrder.id,
              status: genericOrder.status,
              total: genericOrder.total,
              created_at: genericOrder.created_at,
              customer_name: genericOrder.customer_name,
              delivery_address: genericOrder.delivery_address,
              type: genericOrder.type || 'unknown',
              items: genericOrder.order_items,
              table_number: genericOrder.tables?.table_number
          };
          setOrder(mergedOrder);
          setOrderType(genericOrder.type || 'unknown');
      } else {
          // Only throw if strictly nothing was found
          if (!isSilent) setError("Commande introuvable");
      }

    } catch (err) {
      console.error("Error fetching order:", err);
      if (!isSilent) setError(err.message);
    } finally {
      if (!isSilent) setLoading(false);
      isFetchingRef.current = false;
    }
  }, [paramId]);

  // Initial fetch
  useEffect(() => {
    if (paramId) {
        fetchOrder();
    }
  }, [paramId, fetchOrder]);

  // Real-time subscription
  useEffect(() => {
    if (!order) return;

    // Identify IDs to watch
    const parentOrderId = order.orders?.id || (orderType === 'unknown' ? order.id : null);
    const specificOrderId = order.id; // UUID from delivery_orders or restaurant_orders

    const channels = [];

    const handleUpdate = () => {
        console.log("Realtime update received, refreshing...");
        // Use a small timeout to allow DB propagation
        setTimeout(() => fetchOrder(true), 500);
    };

    // 1. Subscribe to parent 'orders' changes
    if (parentOrderId) {
        const orderChannel = supabase.channel(`sub-orders-${parentOrderId}`)
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${parentOrderId}` },
                handleUpdate
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') setConnectionStatus('realtime');
            });
        channels.push(orderChannel);
    }

    // 2. Subscribe to specific table changes (delivery/restaurant)
    if (specificOrderId) {
        const tableName = orderType === 'delivery' ? 'delivery_orders' 
                        : orderType === 'restaurant' ? 'restaurant_orders' 
                        : null;
        
        if (tableName) {
            const specificChannel = supabase.channel(`sub-${tableName}-${specificOrderId}`)
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: tableName, filter: `id=eq.${specificOrderId}` },
                    handleUpdate
                )
                .subscribe();
            channels.push(specificChannel);
        }
    }

    return () => {
        channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [order?.id, order?.orders?.id, orderType, fetchOrder]);

  return { 
    order, 
    loading, 
    error, 
    refresh: () => fetchOrder(false),
    connectionStatus,
    orderType
  };
};