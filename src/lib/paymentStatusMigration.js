import { supabase } from '@/lib/customSupabaseClient';
import { PAYMENT_STATUSES } from '@/lib/deliveryConstants';

export const runPaymentStatusMigration = async () => {
  const report = {
    totalProcessed: 0,
    updated: 0,
    errors: [],
    breakdown: {}
  };

  try {
    console.log('[Migration] Starting payment status migration...');
    
    // Fetch all delivery orders
    const { data: orders, error } = await supabase
      .from('delivery_orders')
      .select('id, payment_status');

    if (error) throw error;
    
    report.totalProcessed = orders.length;
    console.log(`[Migration] Found ${orders.length} orders to check.`);

    for (const order of orders) {
      const currentStatus = order.payment_status;
      let newStatus = null;

      // Map invalid statuses
      if (!currentStatus || currentStatus === 'unpaid' || currentStatus === 'review_pending' || currentStatus === 'new') {
        newStatus = PAYMENT_STATUSES.PENDING;
      } else if (currentStatus === 'paid' || currentStatus === 'completed') {
        newStatus = PAYMENT_STATUSES.CONFIRMED;
      } else if (currentStatus === 'cancelled') {
        newStatus = PAYMENT_STATUSES.FAILED;
      } else if (!Object.values(PAYMENT_STATUSES).includes(currentStatus)) {
        // Unknown values default to pending
        newStatus = PAYMENT_STATUSES.PENDING;
      }

      if (newStatus && newStatus !== currentStatus) {
        const { error: updateError } = await supabase
          .from('delivery_orders')
          .update({ payment_status: newStatus })
          .eq('id', order.id);

        if (updateError) {
          report.errors.push(`Failed to update order ${order.id}: ${updateError.message}`);
        } else {
          report.updated++;
          const key = `${currentStatus} -> ${newStatus}`;
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