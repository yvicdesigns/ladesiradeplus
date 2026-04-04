import { supabase } from '@/lib/customSupabaseClient';

/**
 * Diagnostic function to verify the integrity of order creation data.
 * Checks orders table, related items, and child order tables.
 */
export async function verifyOrderCreationData(orderId, expectedType, expectedRestaurantId) {
  console.log(`[Diagnostic] 🔍 Verifying order creation for Order ID: ${orderId}`);
  console.log(`[Diagnostic] Expected Type: ${expectedType}, Expected RestID: ${expectedRestaurantId}`);
  
  const results = {
    orderExists: false,
    typeCorrect: false,
    restaurantMatch: false,
    itemsExist: false,
    relatedRecordExists: false,
    data: {}
  };

  try {
    // 1. Check orders table
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
      
    if (orderError && orderError.code !== 'PGRST116') {
      console.error(`[Diagnostic] ❌ Error fetching order:`, orderError);
    }

    if (order) {
      results.orderExists = true;
      // Accept either 'type' or 'order_type' matching to be robust
      results.typeCorrect = (order.type === expectedType || order.order_type === expectedType);
      results.restaurantMatch = (order.restaurant_id === expectedRestaurantId);
      results.data.order = order;
      console.log(`[Diagnostic] ✅ Order record found. Type match: ${results.typeCorrect}. RestID match: ${results.restaurantMatch}.`);
    } else {
      console.log(`[Diagnostic] ❌ Order record NOT found.`);
    }

    // 2. Check order_items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      console.error(`[Diagnostic] ❌ Error fetching order items:`, itemsError);
    }

    if (items && items.length > 0) {
      results.itemsExist = true;
      results.data.items = items;
      console.log(`[Diagnostic] ✅ Found ${items.length} order items.`);
    } else {
      console.log(`[Diagnostic] ❌ No order items found.`);
    }

    // 3. Check delivery_orders or restaurant_orders
    if (expectedType === 'delivery') {
      const { data: delOrder, error: delError } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();
        
      if (delError) console.error(`[Diagnostic] ❌ Error fetching delivery_order:`, delError);
        
      if (delOrder) {
        results.relatedRecordExists = true;
        results.data.delivery_order = delOrder;
        console.log(`[Diagnostic] ✅ Delivery order record found.`);
      } else {
        console.log(`[Diagnostic] ❌ Delivery order record NOT found.`);
      }
    } else {
      const { data: restOrder, error: restError } = await supabase
        .from('restaurant_orders')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();
        
      if (restError) console.error(`[Diagnostic] ❌ Error fetching restaurant_order:`, restError);

      if (restOrder) {
        results.relatedRecordExists = true;
        results.data.restaurant_order = restOrder;
        console.log(`[Diagnostic] ✅ Restaurant order record found.`);
      } else {
        console.log(`[Diagnostic] ❌ Restaurant order record NOT found.`);
      }
    }

    console.log(`[Diagnostic] 📊 Final Verification Results for ${orderId}:`, results);
    return results;
  } catch (err) {
    console.error(`[Diagnostic] 💥 Critical error verifying order ${orderId}:`, err);
    return results;
  }
}