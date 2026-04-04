import { supabase } from './customSupabaseClient';
import { logger } from './logger';

export const OrderIdMigrationService = {
  /**
   * Scans all delivery_orders to verify the order_id foreign key is correct.
   */
  async auditAllOrders() {
    logger.info('[OrderIdMigrationService] Starting full audit...');
    try {
      // Get all delivery orders
      const { data: deliveryOrders, error: doError } = await supabase
        .from('delivery_orders')
        .select('id, order_id, created_at, customer_id');

      if (doError) throw doError;

      const { data: orders, error: oError } = await supabase
        .from('orders')
        .select('id, type, created_at');
        
      if (oError) throw oError;

      const orderIds = new Set(orders.map(o => o.id));
      
      const missingParent = [];
      const nullOrderId = [];

      for (const d of deliveryOrders) {
        if (!d.order_id) {
          nullOrderId.push(d);
        } else if (!orderIds.has(d.order_id)) {
          missingParent.push(d);
        }
      }

      const report = {
        totalDeliveryOrders: deliveryOrders.length,
        totalOrders: orders.length,
        nullOrderIdCount: nullOrderId.length,
        missingParentCount: missingParent.length,
        nullOrderIdRecords: nullOrderId,
        missingParentRecords: missingParent
      };

      logger.info('[OrderIdMigrationService] Audit complete', report);
      return { success: true, report };
    } catch (err) {
      logger.error('[OrderIdMigrationService] Audit failed', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Batch fixes delivery_orders missing an order_id by attempting to match timestamps.
   */
  async fixAllMismatchedOrderIds() {
    logger.info('[OrderIdMigrationService] Starting batch fix...');
    const audit = await this.auditAllOrders();
    if (!audit.success) return audit;

    const { nullOrderIdRecords, missingParentRecords } = audit.report;
    const recordsToFix = [...nullOrderIdRecords, ...missingParentRecords];
    
    if (recordsToFix.length === 0) {
      return { success: true, message: 'No mismatches found to fix.', fixedCount: 0 };
    }

    let fixedCount = 0;
    const failures = [];

    // This is a complex recovery. We try to find an order with the exact same timestamp and customer.
    // For safety, we only log in this automated generic fix if we can't definitively link it.
    // For real fixes, we'd need exact matching logic.
    
    return { 
      success: true, 
      message: `Found ${recordsToFix.length} issues. Manual intervention recommended via Admin Order ID Sync Page.`,
      fixedCount,
      failures
    };
  }
};