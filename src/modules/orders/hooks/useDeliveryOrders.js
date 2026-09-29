import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { ordersService } from '../services/ordersService';
import { useToast } from '@/components/ui/use-toast';

export function useDeliveryOrders(initialFilters = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ordersService.fetchDeliveryOrders(filters.status);
      setOrders(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters.status]);

  // Refetch whenever the filter changes
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Keep a ref to the latest fetch fn so the channel effect never needs it as
  // a dependency — fetchOrders changes whenever filters.status changes, which
  // would otherwise tear down and recreate the subscription unnecessarily.
  const fetchOrdersRef = useRef(fetchOrders);
  fetchOrdersRef.current = fetchOrders;

  // Realtime subscription — created once
  useEffect(() => {
    const channel = supabase.channel('public:delivery_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_orders' }, () => {
        fetchOrdersRef.current();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await ordersService.updateOrderStatus(orderId, status);
      toast({ title: "Statut mis à jour" });
      return true;
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const assignDriver = async (orderId, driverId) => {
    toast({ title: "🚧 Option non implémentée", description: "L'assignation de livreur sera disponible bientôt." });
    return false;
  };

  return { orders, loading, error, filters, setFilters, updateStatus, assignDriver, refetch: fetchOrders };
}