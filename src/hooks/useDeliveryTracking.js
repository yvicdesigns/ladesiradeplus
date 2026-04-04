import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { createDeliveryTracking } from '@/services/deliveryService';
import { logger } from '@/lib/logger';

export const useDeliveryTracking = (orderId) => {
  const [order, setOrder] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchOrderData = useCallback(async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      // Fetch main order
      const { data: orderData, error: orderError } = await supabase
        .from('delivery_orders')
        .select(`*, orders:order_id(customer_name, delivery_address, user_id)`)
        .eq('id', orderId)
        .maybeSingle();
        
      if (orderError) throw orderError;
      if (!orderData) {
        setOrder(null);
        return;
      }
      setOrder(orderData);

      // Fetch tracking history
      // Strategy: Check 'delivery_tracking' where delivery_id matches this order's ID
      // If not found, look for linked delivery record.
      let { data: trackingData } = await supabase
        .from('delivery_tracking')
        .select('*')
        .eq('delivery_id', orderId)
        .order('timestamp', { ascending: true });

      if (!trackingData || trackingData.length === 0) {
         // Fallback: Check if there's a delivery record linked to the original order_id
         const { data: deliveryRecord } = await supabase
            .from('deliveries')
            .select('id')
            .eq('order_id', orderData.order_id)
            .maybeSingle();
            
         if (deliveryRecord) {
             const { data: linkedTracking } = await supabase
                .from('delivery_tracking')
                .select('*')
                .eq('delivery_id', deliveryRecord.id)
                .order('timestamp', { ascending: true });
             trackingData = linkedTracking;
         }
      }

      setTrackingHistory(trackingData || []);

    } catch (error) {
      console.error('[Tracking] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Realtime subscription
  useEffect(() => {
    if (!orderId) return;
    fetchOrderData();

    const channel = supabase
      .channel(`tracking_${orderId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'delivery_orders', 
        filter: `id=eq.${orderId}` 
      }, (payload) => {
        setOrder(prev => ({ ...prev, ...payload.new }));
        fetchOrderData(); // refresh tracking history too
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, fetchOrderData]);

  const updateDeliveryStatus = async (newStatus, notes = 'Mise à jour statut') => {
    setActionLoading(true);
    try {
      // 1. Update status in delivery_orders
      const { error } = await supabase
        .from('delivery_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // 2. Add tracking entry safely using the service
      // orderId here is likely the delivery_orders.id. The service will resolve the correct deliveries.id
      const trackingResult = await createDeliveryTracking(
        orderId, 
        newStatus, 
        null, 
        notes, 
        order?.order_id, 
        order?.customer_id
      );

      if (!trackingResult.success) {
        logger.warn(`[useDeliveryTracking] Status updated but tracking log failed: ${trackingResult.error}`);
        // We don't throw here to avoid blocking the user if just the tracking log fails
      }

      toast({ title: "Statut mis à jour", description: newStatus });
      fetchOrderData();
      return true;
    } catch (err) {
      console.error('[useDeliveryTracking] Error updating status:', err);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour le statut" });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    order,
    trackingHistory,
    loading,
    actionLoading,
    updateDeliveryStatus,
    refresh: fetchOrderData,
    isOffline: !navigator.onLine
  };
};