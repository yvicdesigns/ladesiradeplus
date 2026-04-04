import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

let globalRestaurantCache = {
  data: [],
  timestamp: 0
};

export const useRestaurantOrders = () => {
  const [orders, setOrders] = useState(globalRestaurantCache.data);
  const [loading, setLoading] = useState(!globalRestaurantCache.data.length);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const internalFetchOrders = useCallback(async (force = false) => {
    const now = Date.now();
    // Use cache if not forced and within 5 seconds
    if (!force && globalRestaurantCache.data.length > 0 && (now - globalRestaurantCache.timestamp < 5000)) {
       if (mountedRef.current) {
         setOrders(globalRestaurantCache.data);
         setLoading(false);
         setError(null);
       }
       return;
    }

    if (mountedRef.current) setLoading(true);

    try {
      const { data, error: supabaseError } = await supabase
        .from('restaurant_orders')
        .select(`
          id,
          status,
          created_at,
          payment_method,
          customer_id,
          order_id,
          orders:order_id (
            id,
            total,
            table_id,
            order_method,
            customer_name,
            tables (table_number)
          )
        `)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      // Flatten data to make it easier to consume
      const flattenedData = (data || []).map(order => ({
        ...order,
        total: order.orders?.total || 0,
        table_number: order.orders?.tables?.table_number,
        customer_name: order.orders?.customer_name,
        order_method: order.orders?.order_method || 'unknown'
      }));

      // Cache update
      globalRestaurantCache = {
        data: flattenedData,
        timestamp: Date.now()
      };

      if (mountedRef.current) {
        setOrders(flattenedData);
        setError(null);
      }
    } catch (err) {
      console.error('[useRestaurantOrders] Fetch Error:', err);
      if (mountedRef.current) {
        setError(err);
        toast({
          variant: "destructive",
          title: "Erreur de chargement",
          description: "Impossible de récupérer les commandes du restaurant."
        });
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [toast]);

  // Initial fetch and subscriptions setup
  useEffect(() => {
    internalFetchOrders();

    const channel = supabase
      .channel('restaurant_orders_sub')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_orders' },
        (payload) => {
          console.log("[useRestaurantOrders] Realtime update:", payload);
          // Force refresh on any change
          internalFetchOrders(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [internalFetchOrders]);

  const updateOrderStatus = async (id, status) => {
    try {
      const { error: updateError } = await supabase
        .from('restaurant_orders')
        .update({ status })
        .eq('id', id);
        
      if (updateError) throw updateError;
      
      // Optimistic cache update
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      globalRestaurantCache.data = globalRestaurantCache.data.map(o => o.id === id ? { ...o, status } : o);

      toast({ title: "Statut mis à jour", description: "La commande a été mise à jour avec succès." });
      return { success: true };
    } catch (err) {
      console.error('[useRestaurantOrders] Update Error:', err);
      toast({ variant: "destructive", title: "Erreur de mise à jour", description: err.message });
      return { success: false, error: err };
    }
  };

  // EXPORTS: Strictly structured as requested
  // fetchOrders is COMPLETELY REMOVED to prevent any legacy code from invoking it.
  return {
    orders: orders || [],
    loading,
    error,
    updateOrderStatus,
    refresh: () => internalFetchOrders(true)
  };
};