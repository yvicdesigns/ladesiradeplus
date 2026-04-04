import { supabase } from '@/lib/customSupabaseClient';
import { VALID_RESTAURANT_ID } from './restaurantValidation';
import { logger } from '@/lib/logger';

/**
 * Migration script to identify and optionally fix invalid restaurant_ids in orders.
 */
export const fixInvalidRestaurantIds = async (autoFix = false) => {
  try {
    logger.info('[Migration] Starting invalid restaurant_id scan...');
    
    // Find orders where restaurant_id is not the valid one
    const { data: invalidOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id, restaurant_id, status, created_at')
      .neq('restaurant_id', VALID_RESTAURANT_ID);

    if (fetchError) throw fetchError;

    logger.info(`[Migration] Found ${invalidOrders?.length || 0} orders with incorrect restaurant_id.`);

    const report = {
      scanned: true,
      invalidCount: invalidOrders?.length || 0,
      fixedCount: 0,
      errors: [],
      details: invalidOrders || []
    };

    if (autoFix && invalidOrders && invalidOrders.length > 0) {
      logger.info(`[Migration] Auto-fix is enabled. Updating ${invalidOrders.length} records to ${VALID_RESTAURANT_ID}...`);
      
      for (const order of invalidOrders) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ restaurant_id: VALID_RESTAURANT_ID })
          .eq('id', order.id);

        if (updateError) {
          logger.error(`[Migration] Failed to update order ${order.id}:`, updateError);
          report.errors.push({ id: order.id, error: updateError.message });
        } else {
          report.fixedCount++;
        }
      }
      
      logger.info(`[Migration] Auto-fix complete. Fixed ${report.fixedCount}/${report.invalidCount} orders.`);
    }

    return { success: true, report };
  } catch (err) {
    logger.error('[Migration] Critical error during fix operation:', err);
    return { success: false, error: err.message };
  }
};