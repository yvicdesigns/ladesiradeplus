import { supabase } from '@/lib/customSupabaseClient';

/**
 * COMPREHENSIVE DELIVERY ORDER DIAGNOSTIC INVESTIGATION
 * This script analyzes why client order tracking is stuck on "Confirmé"
 */

// PART 1: Database Data Inspection
export const inspectOrdersTable = async () => {
  try {
    // We fetch a sample to analyze since we can't easily do GROUP BY in pure PostgREST without RPC
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, status, type, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    const statuses = [...new Set(orders.map(o => o.status))];
    const types = [...new Set(orders.map(o => o.type))];

    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    const typeCounts = orders.reduce((acc, o) => {
      acc[o.type] = (acc[o.type] || 0) + 1;
      return acc;
    }, {});

    const deliveryOrdersCount = orders.filter(o => o.type === 'delivery').length;

    return {
      success: true,
      data: {
        totalAnalyzed: orders.length,
        actualStatuses: statuses,
        actualTypes: types,
        statusCounts,
        typeCounts,
        deliveryOrdersCount,
        recentSample: orders.slice(0, 10)
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// PART 2: Delivery Orders Table Analysis
export const analyzeDeliveryOrdersTable = async () => {
  try {
    const { data: deliveryOrders, error } = await supabase
      .from('delivery_orders')
      .select(`
        id, order_id, status, payment_status, created_at, updated_at,
        orders (id, status, type)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const statuses = [...new Set(deliveryOrders.map(do_ => do_.status))];
    
    const mismatches = deliveryOrders.filter(do_ => 
      do_.orders && do_.status !== do_.orders.status
    ).map(do_ => ({
      delivery_order_id: do_.id,
      order_id: do_.order_id,
      delivery_order_status: do_.status,
      orders_status: do_.orders?.status
    }));

    return {
      success: true,
      data: {
        totalAnalyzed: deliveryOrders.length,
        actualStatuses: statuses,
        mismatchesFound: mismatches.length,
        mismatchesSample: mismatches.slice(0, 10),
        recentSample: deliveryOrders.slice(0, 10).map(d => ({
          id: d.id,
          order_id: d.order_id,
          status: d.status,
          parent_order_status: d.orders?.status,
          created_at: d.created_at
        }))
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// PART 3: Test Order Investigation
export const investigateSpecificOrder = async (orderId) => {
  if (!orderId) return { success: false, error: "Order ID is required" };

  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    const { data: deliveryOrder, error: doError } = await supabase
      .from('delivery_orders')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    return {
      success: true,
      data: {
        orderId,
        ordersTableData: order || (orderError ? orderError.message : 'Not found'),
        deliveryOrdersTableData: deliveryOrder || (doError ? doError.message : 'Not found'),
        orderItemsData: orderItems || (itemsError ? itemsError.message : 'Not found'),
        exactType: order?.type,
        exactStatus: order?.status,
        deliveryOrderStatus: deliveryOrder?.status,
        statusMatch: order?.status === deliveryOrder?.status
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// PART 4: Realtime Subscription Filter Analysis
export const analyzeRealtimeFilters = () => {
  return {
    success: true,
    data: {
      explanation: `
The client tracks status via 'useRealtimeDeliveryOrders' hook.
This hook sets up a realtime subscription with:
filter: 'type=eq.delivery' on table: 'orders'

ANALYSIS:
1. If the order was created with type='delivery' (exact string), the realtime event WILL trigger when 'orders' table is updated.
2. If the type is NULL, 'Delivery', 'livraison', or anything else, the event WILL NOT trigger.
3. CRITICAL: When the admin updates the status via 'updateOrderStatus', it updates the 'orders' table.
4. However, if the client UI (OrderTrackingPage) fetches its INITIAL state from 'delivery_orders' instead of 'orders', or if the UI relies on 'delivery_orders.status' which isn't updated, the UI will be stuck.
      `
    }
  };
};

// PART 5: useDeliveryOrdersData Query Analysis
export const analyzeDeliveryQuery = async (orderId = null) => {
  try {
    let query = supabase
        .from('orders')
        .select(`
          id, created_at, customer_name, delivery_address, total, status, is_deleted, type,
          delivery_orders (id, payment_method, payment_status),
          order_items (id)
        `)
        .eq('type', 'delivery');
        
    if (orderId) {
        query = query.eq('id', orderId);
    } else {
        query = query.limit(5);
    }

    const { data, error } = await query;

    return {
      success: true,
      data: {
        queryBuilt: "supabase.from('orders').select('id, created_at, status, type, delivery_orders(id), order_items(id)').eq('type', 'delivery')",
        columnsSelected: ['id', 'created_at', 'customer_name', 'delivery_address', 'total', 'status', 'is_deleted', 'type', 'delivery_orders', 'order_items'],
        filtersApplied: "type = 'delivery'",
        testResult: data,
        error: error?.message,
        observation: data && data.length === 0 ? "WARNING: No orders returned. Check if 'type' is exactly 'delivery' in the database." : "Orders found matching filter."
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// PART 6: Status Update Trace
export const traceStatusUpdate = async (orderId) => {
  if (!orderId) return { success: false, error: "Order ID required for trace" };

  try {
    // 1. Get initial state
    const { data: initial } = await supabase.from('orders').select('status, type').eq('id', orderId).single();
    const { data: initialDO } = await supabase.from('delivery_orders').select('status').eq('order_id', orderId).maybeSingle();

    return {
      success: true,
      data: {
        step1_InitialState: {
          orders_status: initial?.status,
          orders_type: initial?.type,
          delivery_orders_status: initialDO?.status
        },
        step2_Simulation: "Admin calls updateOrderStatus(id, 'En cours')",
        step3_RealtimeCheck: `Because type is '${initial?.type}', the realtime filter 'type=eq.delivery' will ${initial?.type === 'delivery' ? 'MATCH AND TRIGGER' : 'FAIL TO TRIGGER'}.`,
        step4_RootCauseHypothesis: initial?.type !== 'delivery' 
          ? "The order 'type' column is NOT 'delivery'. Realtime subscription ignores updates for this order." 
          : "The order 'type' is correct. The issue is likely that the Client UI reads from 'delivery_orders.status' which is NOT updated when 'orders.status' is updated, OR the UI doesn't refresh properly on realtime event.",
        recommendation: "Ensure Client reads status from 'orders.status', NOT 'delivery_orders.status'. Ensure realtime filter matches the actual 'type' value."
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};