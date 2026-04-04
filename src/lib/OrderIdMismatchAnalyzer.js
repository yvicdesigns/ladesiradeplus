import { supabase } from './customSupabaseClient';

export const OrderIdMismatchAnalyzer = {
  async analyzeRecentOrders(hours = 24) {
    try {
      const timeLimit = new Date();
      timeLimit.setHours(timeLimit.getHours() - hours);
      const isoDate = timeLimit.toISOString();

      // 1. Get recent orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, created_at, type, status, user_id')
        .gte('created_at', isoDate);

      if (ordersError) throw ordersError;

      // 2. Get recent delivery orders
      const { data: deliveryOrders, error: deliveryError } = await supabase
        .from('delivery_orders')
        .select('id, order_id, created_at, status, customer_id')
        .gte('created_at', isoDate);

      if (deliveryError) throw deliveryError;

      const analysis = {
        timestamp: new Date().toISOString(),
        periodHours: hours,
        totalOrders: orders.length,
        totalDeliveryOrders: deliveryOrders.length,
        orphanedOrders: [],
        orphanedDeliveryOrders: [],
        mismatchedPairs: [],
        recommendations: []
      };

      const orderMap = new Map(orders.map(o => [o.id, o]));
      const deliveryOrderMap = new Map(deliveryOrders.map(d => [d.id, d]));
      const deliveryOrderParentMap = new Map(deliveryOrders.map(d => [d.order_id, d]));

      // Find Orphaned Orders (delivery type but no delivery_order)
      orders.forEach(order => {
        if (order.type === 'delivery' && !deliveryOrderParentMap.has(order.id)) {
          analysis.orphanedOrders.push(order);
        }
      });

      // Find Orphaned Delivery Orders (no parent order)
      deliveryOrders.forEach(doRecord => {
        if (!doRecord.order_id || !orderMap.has(doRecord.order_id)) {
          analysis.orphanedDeliveryOrders.push(doRecord);
        }
      });

      // Heuristic: Try to find mismatches based on exact timestamp matching (within 1 second)
      analysis.orphanedDeliveryOrders.forEach(orphanedDo => {
        const doTime = new Date(orphanedDo.created_at).getTime();
        const possibleParents = analysis.orphanedOrders.filter(o => {
           const oTime = new Date(o.created_at).getTime();
           return Math.abs(oTime - doTime) < 2000; // Within 2 seconds
        });

        if (possibleParents.length === 1) {
          analysis.mismatchedPairs.push({
            suggestedOrder: possibleParents[0],
            orphanedDeliveryOrder: orphanedDo,
            confidence: 'High - Timestamp Match'
          });
        }
      });

      // Generate Recommendations
      if (analysis.orphanedDeliveryOrders.length > 0) {
        analysis.recommendations.push("Found delivery_orders without a valid parent order. This indicates a failure in the atomic creation process or a foreign key constraint missing.");
      }
      if (analysis.orphanedOrders.length > 0) {
        analysis.recommendations.push("Found delivery orders that never had their delivery_order child created. RPC create_order_with_items might be failing silently.");
      }

      return { success: true, analysis };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};