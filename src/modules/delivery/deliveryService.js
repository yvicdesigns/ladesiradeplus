import { RESTAURANT_ID } from '@/lib/adminSettingsUtils';
import { supabase } from '@/lib/customSupabaseClient';
import { normalizeSupabaseError } from '@/lib/errorHandler';
import { logAudit } from '@/lib/auditLogUtils';
import { AUDIT_ACTIONS } from '@/constants/AUDIT_ACTIONS';

export const deliveryService = {
  async createDeliveryOrder(payload) {
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      
      await logAudit(AUDIT_ACTIONS.INSERT, 'delivery_orders', data.id, data, 'Delivery order created');
      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeSupabaseError(err) };
    }
  },

  async updateDeliveryStatus(id, status) {
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .update({ status })
        .eq('id', id)
        .select();
      if (error) throw error;
      
      await logAudit(AUDIT_ACTIONS.UPDATE, 'delivery_orders', id, { status }, `Status updated to ${status}`);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeSupabaseError(err) };
    }
  },

  async assignDriver(id, driverId) {
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .update({ status: 'assigned' })
        .eq('id', id)
        .select();
      if (error) throw error;
      
      await logAudit(AUDIT_ACTIONS.UPDATE, 'delivery_orders', id, { status: 'assigned', driverId }, `Driver assigned: ${driverId}`);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeSupabaseError(err) };
    }
  },

  async getDeliveryZones(restaurantId = RESTAURANT_ID) {
    try {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_deleted', false);
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeSupabaseError(err) };
    }
  },

  calculateDeliveryFee(distanceKm, baseFee = 1000) {
    return baseFee + Math.max(0, (distanceKm - 2)) * 500;
  },

  async trackDelivery(deliveryId) {
    try {
      const { data, error } = await supabase
        .from('delivery_tracking')
        .select('*')
        .eq('delivery_id', deliveryId)
        .order('timestamp', { ascending: false });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeSupabaseError(err) };
    }
  }
};