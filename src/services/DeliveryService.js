import { deliveryService } from '@/modules/delivery/deliveryService';
import { logAudit } from '@/lib/auditLogUtils';
import { AUDIT_ACTIONS } from '@/constants/AUDIT_ACTIONS';
import { supabase } from '@/lib/customSupabaseClient';

export const createDeliveryTracking = async (deliveryId, status, location, notes, orderId, customerId) => {
  try {
    const { error } = await supabase.from('delivery_tracking').insert({
      delivery_id: deliveryId,
      status,
      location: location || null,
      notes: notes || null,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      is_deleted: false
    });
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

export const GlobalDeliveryService = {
  async orchestrateDeliveryAssignment(deliveryOrderId, driverId) {
    const result = await deliveryService.assignDriver(deliveryOrderId, driverId);
    if (result.data) {
       await logAudit(AUDIT_ACTIONS.UPDATE, 'delivery_orders', deliveryOrderId, null, `Assigné au livreur ${driverId}`);
    }
    return result;
  },

  async handleDeliveryStatusChange(deliveryOrderId, status) {
    const result = await deliveryService.updateDeliveryStatus(deliveryOrderId, status);
    if (result.data) {
       await logAudit(AUDIT_ACTIONS.UPDATE, 'delivery_orders', deliveryOrderId, null, `Statut livraison changé vers ${status}`);
    }
    return result;
  }
};