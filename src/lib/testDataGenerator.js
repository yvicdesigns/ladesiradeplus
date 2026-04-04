import { supabase } from '@/lib/customSupabaseClient';
import { saveAs } from 'file-saver';
import { VALID_RESTAURANT_ID } from './restaurantValidation';

export const generateTestOrders = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'in_transit', 'delivered', 'cancelled', 'rejected'];
    const paymentMethods = ['cash', 'mobile_money', 'wallet'];
    const paymentStatuses = ['paid', 'unpaid', 'pending_payment', 'refunded'];

    const testOrders = [];
    
    // Fetch a valid menu item to associate with order_items
    const { data: menuItems } = await supabase.from('menu_items').select('id, price').limit(1);
    const menuItemId = menuItems?.[0]?.id;
    const itemPrice = menuItems?.[0]?.price || 1000;

    for (let i = 0; i < 10; i++) {
      const status = statuses[i % statuses.length];
      const paymentMethod = paymentMethods[i % paymentMethods.length];
      const paymentStatus = paymentStatuses[i % paymentStatuses.length];

      // 1. Create Order
      const { data: order, error: orderError } = await supabase.from('orders').insert({
        user_id: user.id,
        restaurant_id: VALID_RESTAURANT_ID,
        customer_name: `Test Customer ${i}`,
        customer_phone: `+2420000000${i}`,
        type: i % 2 === 0 ? 'delivery' : 'restaurant',
        total: itemPrice * 2,
        status: status,
        is_deleted: false
      }).select().single();

      if (orderError) throw orderError;

      // 2. Create Order Items
      if (menuItemId) {
        await supabase.from('order_items').insert({
          order_id: order.id,
          menu_item_id: menuItemId,
          quantity: 2,
          price: itemPrice,
          status: status
        });
      }

      // 3. Create specific sub-orders based on type
      if (order.type === 'delivery') {
        await supabase.from('delivery_orders').insert({
          order_id: order.id,
          restaurant_id: VALID_RESTAURANT_ID,
          status: status,
          payment_method: paymentMethod,
          payment_status: paymentStatus
        });
      } else {
        await supabase.from('restaurant_orders').insert({
          order_id: order.id,
          restaurant_id: VALID_RESTAURANT_ID,
          status: status,
          payment_method: paymentMethod,
          payment_status: paymentStatus
        });
      }

      // 4. Create Payment Record
      await supabase.from('payments').insert({
        order_id: order.id,
        amount: order.total,
        payment_method: paymentMethod,
        status: paymentStatus
      });

      testOrders.push({
        id: order.id,
        status,
        type: order.type,
        payment_method: paymentMethod,
        payment_status: paymentStatus
      });
    }

    // Save summary to file
    const blob = new Blob([JSON.stringify(testOrders, null, 2)], { type: "application/json;charset=utf-8" });
    saveAs(blob, "test-orders-summary.json");
    
    console.log("Generated Test Orders:", testOrders);
    return { success: true, data: testOrders };

  } catch (error) {
    console.error("Error generating test orders:", error);
    return { success: false, error: error.message };
  }
};