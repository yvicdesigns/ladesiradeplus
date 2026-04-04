import { supabase } from './customSupabaseClient';

export const OrderIdFixService = {
  async identifyMismatchedPairs() {
    // Uses Analyzer to find highly confident pairs
    const { OrderIdMismatchAnalyzer } = await import('./OrderIdMismatchAnalyzer.js');
    return await OrderIdMismatchAnalyzer.analyzeRecentOrders(72); // Look back 3 days
  },

  async fixOrphanedDeliveryOrders(pairsToFix) {
    if (!Array.isArray(pairsToFix) || pairsToFix.length === 0) {
      return { success: false, message: 'No pairs provided to fix' };
    }

    const results = [];
    let successCount = 0;

    for (const pair of pairsToFix) {
      const deliveryOrderId = pair.orphanedDeliveryOrder.id;
      const targetOrderId = pair.suggestedOrder.id;

      try {
        const { error } = await supabase
          .from('delivery_orders')
          .update({ order_id: targetOrderId })
          .eq('id', deliveryOrderId);

        if (error) throw error;
        
        successCount++;
        results.push({ deliveryOrderId, targetOrderId, status: 'Fixed' });
        
        // Log to audit
        await supabase.from('audit_logs').insert({
          action: 'FIX_ORPHANED_DELIVERY_ORDER',
          table_name: 'delivery_orders',
          record_id: deliveryOrderId,
          reason: `Auto-linked to order ${targetOrderId} based on timestamp heuristic`
        });

      } catch (err) {
        results.push({ deliveryOrderId, targetOrderId, status: 'Failed', error: err.message });
      }
    }

    return { success: true, fixed: successCount, total: pairsToFix.length, results };
  },

  async consolidateOrderRecords(orderId, deliveryOrderId) {
    try {
       // Direct forced link if admin specifies exactly what to link
       const { error } = await supabase
          .from('delivery_orders')
          .update({ order_id: orderId })
          .eq('id', deliveryOrderId);

       if (error) throw error;

       await supabase.from('audit_logs').insert({
          action: 'MANUAL_LINK_ORDER',
          table_name: 'delivery_orders',
          record_id: deliveryOrderId,
          reason: `Manually linked to order ${orderId} by admin`
        });

       return { success: true, message: `Successfully linked delivery_order ${deliveryOrderId} to order ${orderId}` };
    } catch (error) {
       return { success: false, error: error.message };
    }
  }
};