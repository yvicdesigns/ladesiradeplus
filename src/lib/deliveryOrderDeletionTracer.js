import { supabase } from '@/lib/customSupabaseClient';

export const traceDeliveryOrderDeletion = async (deliveryOrderId) => {
  console.log('🔴 [TRACER] Initiating Deletion Tracer Flow');
  console.log(`🔴 [TRACER] Target ID provided: ${deliveryOrderId}`);
  
  const report = {
    targetId: deliveryOrderId,
    targetTable: 'delivery_orders',
    steps: [],
    relatedRecords: {},
    proposedPlan: [],
    status: 'analyzing'
  };

  try {
    // Step 1: Verify the delivery_order exists and get parent order_id
    report.steps.push({ step: 1, action: `Fetch delivery_orders where id = ${deliveryOrderId}` });
    const { data: deliveryOrder, error: fetchError } = await supabase
      .from('delivery_orders')
      .select('*')
      .eq('id', deliveryOrderId)
      .single();

    if (fetchError) {
      report.steps.push({ step: 1, status: 'error', error: fetchError.message });
      report.status = 'failed';
      console.error('🔴 [TRACER] Failed to fetch delivery_order:', fetchError);
      return report;
    }

    report.relatedRecords.deliveryOrder = deliveryOrder;
    const parentOrderId = deliveryOrder.order_id;
    console.log(`🔴 [TRACER] Found parent order_id: ${parentOrderId}`);

    // Step 2: Fetch parent order
    if (parentOrderId) {
      report.steps.push({ step: 2, action: `Fetch orders where id = ${parentOrderId}` });
      const { data: parentOrder, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', parentOrderId)
        .single();
        
      if (!orderError) {
        report.relatedRecords.parentOrder = parentOrder;
      }
      
      // Step 3: Fetch order_items
      report.steps.push({ step: 3, action: `Fetch order_items where order_id = ${parentOrderId}` });
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('id, menu_item_id, quantity')
        .eq('order_id', parentOrderId);
        
      if (!itemsError) {
        report.relatedRecords.orderItems = orderItems || [];
        console.log(`🔴 [TRACER] Found ${orderItems?.length || 0} order_items`);
      }
    }

    // Propose Execution Plan
    report.proposedPlan = [
      { order: 1, table: 'order_items', action: 'DELETE', condition: `order_id = ${parentOrderId}`, count: report.relatedRecords.orderItems?.length || 0 },
      { order: 2, table: 'delivery_orders', action: 'DELETE', condition: `id = ${deliveryOrderId}`, count: 1 },
      { order: 3, table: 'orders', action: 'DELETE', condition: `id = ${parentOrderId}`, count: parentOrderId ? 1 : 0 }
    ];

    report.status = 'ready';
    console.log('🔴 [TRACER] Trace Complete. Report generated:', report);
    return report;

  } catch (error) {
    console.error('🔴 [TRACER] Exception during trace:', error);
    report.status = 'exception';
    report.error = error.message;
    return report;
  }
};