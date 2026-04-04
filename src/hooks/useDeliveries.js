import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useDeliveries = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getDeliveries = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      let query = supabase.from('deliveries').select('*').order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.driver_id) {
        query = query.eq('driver_id', filters.driver_id);
      }
      if (filters.date) {
        query = query.eq('delivery_date', filters.date);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      setError(err);
      toast({ title: 'Error', description: 'Failed to fetch deliveries', variant: 'destructive' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getDeliveryById = useCallback(async (id) => {
    try {
      // Try direct fetch
      let { data, error: fetchError } = await supabase
        .from('deliveries')
        .select(`*, delivery_tracking (*)`)
        .eq('id', id)
        .maybeSingle(); // Changed from single() to maybeSingle()

      // If not found, it might be a delivery_order ID, try to find linked delivery
      if (!data) {
          const { data: orderLink } = await supabase
            .from('delivery_orders')
            .select('order_id')
            .eq('id', id)
            .maybeSingle(); // Changed from single() to maybeSingle()
            
          if (orderLink?.order_id) {
             const { data: linkedDelivery } = await supabase
                .from('deliveries')
                .select(`*, delivery_tracking (*)`)
                .eq('order_id', orderLink.order_id)
                .maybeSingle(); // Changed from single() to maybeSingle()
             if (linkedDelivery) data = linkedDelivery;
          }
      }

      if (fetchError && !data) throw fetchError;
      return data;
    } catch (err) {
      console.error('Error fetching delivery details:', err);
      return null;
    }
  }, []);

  const createDelivery = useCallback(async (deliveryData) => {
    setLoading(true);
    try {
      // 1. Create delivery
      const { data, error: createError } = await supabase
        .from('deliveries')
        .insert([{
          ...deliveryData,
          status: 'pending',
          tracking_number: `TRK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        }])
        .select()
        .single();

      if (createError) throw createError;

      // 2. Create initial tracking entry
      const { error: trackingError } = await supabase
        .from('delivery_tracking')
        .insert([{
          delivery_id: data.id,
          status: 'pending',
          notes: 'Delivery created',
          location: 'Origin'
        }]);
      
      if (trackingError) console.error("Initial tracking error", trackingError);

      toast({ title: 'Success', description: 'Delivery created successfully' });
      return data;
    } catch (err) {
      console.error('Error creating delivery:', err);
      setError(err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateDelivery = useCallback(async (id, updates) => {
    setLoading(true);
    try {
      const { data, error: updateError } = await supabase
        .from('deliveries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      toast({ title: 'Success', description: 'Delivery updated successfully' });
      return data;
    } catch (err) {
      console.error('Error updating delivery:', err);
      setError(err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteDelivery = useCallback(async (id) => {
    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('deliveries')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast({ title: 'Success', description: 'Delivery deleted successfully' });
      return true;
    } catch (err) {
      console.error('Error deleting delivery:', err);
      setError(err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const assignDriver = useCallback(async (id, driverData) => {
    return updateDelivery(id, {
      driver_id: driverData.id,
      driver_name: driverData.name,
      driver_phone: driverData.phone,
      vehicle_type: driverData.vehicle_type,
      status: 'assigned'
    });
  }, [updateDelivery]);

  const changeStatus = useCallback(async (id, status, notes = '') => {
    setLoading(true);
    try {
      // Validation: Ensure delivery exists
      const { data: exists } = await supabase.from('deliveries').select('*').eq('id', id).maybeSingle(); // Changed from select('id').single()
      if (!exists) {
          throw new Error("Delivery record not found. Cannot update status.");
      }

      // 1. Update delivery status
      const { error: updateError } = await supabase
        .from('deliveries')
        .update({ status })
        .eq('id', id);

      if (updateError) throw updateError;

      // 2. Add tracking entry
      const { error: trackingError } = await supabase
        .from('delivery_tracking')
        .insert([{
          delivery_id: id,
          status,
          notes,
          timestamp: new Date().toISOString()
        }]);

      if (trackingError) throw trackingError;

      toast({ title: 'Success', description: `Status updated to ${status}` });
      return true;
    } catch (err) {
      console.error('Error changing status:', err);
      setError(err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addTrackingNote = useCallback(async (deliveryId, status, note) => {
    setLoading(true);
    try {
      // Validation
      const { data: exists } = await supabase.from('deliveries').select('*').eq('id', deliveryId).maybeSingle(); // Changed from select('id').single()
      if (!exists) throw new Error("Delivery record not found");

      const { error: trackingError } = await supabase
        .from('delivery_tracking')
        .insert([{
          delivery_id: deliveryId,
          status,
          notes: note,
          timestamp: new Date().toISOString()
        }]);

      if (trackingError) throw trackingError;

      toast({ title: 'Success', description: 'Note added successfully' });
      return true;
    } catch (err) {
      console.error('Error adding note:', err);
      setError(err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    error,
    getDeliveries,
    getDeliveryById,
    createDelivery,
    updateDelivery,
    deleteDelivery,
    assignDriver,
    changeStatus,
    addTrackingNote
  };
};