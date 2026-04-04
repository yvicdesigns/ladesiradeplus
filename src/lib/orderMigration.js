import { supabase } from '@/lib/customSupabaseClient';
import { ORDER_STATUSES } from '@/lib/formatters';

// Map old/legacy statuses to new valid statuses
const STATUS_MAPPING = {
  // Legacy -> New
  'pending': ORDER_STATUSES.NEW,
  'nouvelle': ORDER_STATUSES.NEW,
  
  'acceptée': ORDER_STATUSES.CONFIRMED,
  'accepted': ORDER_STATUSES.CONFIRMED,
  
  'en_préparation': ORDER_STATUSES.PREPARING,
  
  'prête': ORDER_STATUSES.READY,
  
  'livreur_assigné': ORDER_STATUSES.DRIVER_ASSIGNED,
  'assigned': ORDER_STATUSES.DRIVER_ASSIGNED,
  
  'en_livraison': ORDER_STATUSES.IN_TRANSIT,
  
  'livreur_arrivé': ORDER_STATUSES.DRIVER_ARRIVED,
  
  'livrée': ORDER_STATUSES.DELIVERED,
  
  'terminée': ORDER_STATUSES.COMPLETED,
  'completed': ORDER_STATUSES.COMPLETED,
  
  'annulée': ORDER_STATUSES.CANCELLED,
  'cancelled': ORDER_STATUSES.CANCELLED,
  
  'refusée': ORDER_STATUSES.REJECTED,
  'rejected': ORDER_STATUSES.REJECTED
};

export const runOrderStatusMigration = async () => {
  const report = {
    totalProcessed: 0,
    updated: 0,
    errors: [],
    breakdown: {}
  };

  try {
    console.log('[Migration] Starting order status migration...');
    
    // 1. Fetch all delivery orders
    // We select ID and status
    const { data: orders, error } = await supabase
      .from('delivery_orders')
      .select('id, status');

    if (error) throw error;
    
    report.totalProcessed = orders.length;
    console.log(`[Migration] Found ${orders.length} orders to check.`);

    // 2. Iterate and update
    for (const order of orders) {
      const currentStatus = order.status;
      
      // If status is already a valid NEW status key, skip (unless we want to normalize casings)
      // We check if currentStatus is exactly one of the values in ORDER_STATUSES
      const isValid = Object.values(ORDER_STATUSES).includes(currentStatus);
      
      if (isValid) {
         continue;
      }

      // It's invalid or legacy, check mapping
      const newStatus = STATUS_MAPPING[currentStatus] || STATUS_MAPPING[currentStatus?.toLowerCase()];
      
      if (newStatus) {
        // Perform Update
        const { error: updateError } = await supabase
          .from('delivery_orders')
          .update({ status: newStatus })
          .eq('id', order.id);

        if (updateError) {
          report.errors.push(`Failed to update order ${order.id}: ${updateError.message}`);
        } else {
          report.updated++;
          // Track breakdown
          const key = `${currentStatus} -> ${newStatus}`;
          report.breakdown[key] = (report.breakdown[key] || 0) + 1;
        }
      } else {
        // Log unknown status that has no mapping
        if (currentStatus) {
            const key = `UNKNOWN (${currentStatus})`;
            report.breakdown[key] = (report.breakdown[key] || 0) + 1;
        }
      }
    }

    console.log('[Migration] Completed.', report);
    return { success: true, report };

  } catch (err) {
    console.error('[Migration] Critical Error:', err);
    return { success: false, error: err.message, report };
  }
};