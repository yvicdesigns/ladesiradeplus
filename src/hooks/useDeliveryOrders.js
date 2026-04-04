import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { handleTokenRefreshError } from '@/lib/tokenRefreshHandler';

// Global cache to prevent re-fetching on rapid unmount/remount
let globalDeliveryCache = {
  data: [],
  timestamp: 0
};

export const useDeliveryOrders = () => {
  const [orders, setOrders] = useState(globalDeliveryCache.data);
  const [loading, setLoading] = useState(!globalDeliveryCache.data.length);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const mountedRef = useRef(true);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchOrders = useCallback(async (force = false) => {
    // Cache check: 5 seconds validity
    const now = Date.now();
    if (!force && globalDeliveryCache.data.length > 0 && (now - globalDeliveryCache.timestamp < 5000)) {
      setOrders(globalDeliveryCache.data);
      setLoading(false);
      return;
    }

    if (mountedRef.current) setLoading(true);
    
    try {
      const startTime = performance.now();
      
      const { data, error: fetchError } = await supabase
        .from('delivery_orders')
        .select(`
          id, 
          status, 
          created_at, 
          payment_status,
          payment_screenshot_url,
          delivery_fee,
          calculated_delivery_fee,
          distance_km,
          zone_id,
          estimated_delivery_time_text,
          updated_at,
          delivery_zones!delivery_orders_zone_id_fkey(*),
          orders:order_id (
            id,
            customer_name,
            delivery_address,
            user_id,
            total,
            status
          ),
          customers:customer_id (id, name, phone)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        const { shouldRedirect } = await handleTokenRefreshError(fetchError);
        if (shouldRedirect) throw new Error("Session expirée");
        throw fetchError;
      }

      const duration = performance.now() - startTime;
      if (duration > 1000) {
        console.warn(`Slow delivery_orders query took ${duration.toFixed(2)}ms`);
      }
      
      // Update cache
      globalDeliveryCache = {
        data: data || [],
        timestamp: Date.now()
      };

      if (mountedRef.current) {
        setOrders(data || []);
      }
    } catch (err) {
      console.error("Delivery orders fetch error:", err);
      if (mountedRef.current) {
        setError(err);
        if (err.message !== "Session expirée") {
          toast({ variant: "destructive", title: "Erreur", description: "Chargement échoué" });
        }
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [toast]);

  // Realtime
  useEffect(() => {
    fetchOrders();
    
    const channel = supabase
      .channel('admin_delivery_orders_sub')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'delivery_orders' }, 
        () => {
           fetchOrders(true); // Force refresh on realtime event
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to delivery_orders changes');
        }
      });

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [fetchOrders]);

  const updateOrderStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('delivery_orders')
        .update({ status })
        .eq('id', id);

      if (error) {
        const { shouldRedirect } = await handleTokenRefreshError(error);
        if (shouldRedirect) throw new Error("Session expirée");
        throw error;
      }
      
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      globalDeliveryCache.data = globalDeliveryCache.data.map(o => o.id === id ? { ...o, status } : o);
      
      toast({ title: "Succès", description: "Statut mis à jour" });
      return true;
    } catch (err) {
      console.error(err);
      if (err.message !== "Session expirée") {
        toast({ variant: "destructive", title: "Erreur", description: "Mise à jour échouée" });
      }
      return false;
    }
  };

  const updatePaymentStatus = async (id, payment_status) => {
    try {
       const updates = { payment_status };
       if (payment_status === 'paid' || payment_status === 'confirmed') {
           updates.payment_confirmed_at = new Date().toISOString();
       }
       
       const { error } = await supabase
        .from('delivery_orders')
        .update(updates)
        .eq('id', id);

      if (error) {
        const { shouldRedirect } = await handleTokenRefreshError(error);
        if (shouldRedirect) throw new Error("Session expirée");
        throw error;
      }
      
      // Optimistic
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
      globalDeliveryCache.data = globalDeliveryCache.data.map(o => o.id === id ? { ...o, ...updates } : o);
      
      toast({ title: "Succès", description: "Paiement mis à jour" });
      return true;
    } catch (err) {
      console.error(err);
      if (err.message !== "Session expirée") {
        toast({ variant: "destructive", title: "Erreur", description: "Mise à jour paiement échouée" });
      }
      return false;
    }
  };

  return { orders, loading, error, updateOrderStatus, updatePaymentStatus, refresh: () => fetchOrders(true) };
};