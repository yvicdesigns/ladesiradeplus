import { supabase } from '@/lib/customSupabaseClient';
import { logger } from '@/lib/logger';

const TEST_PREFIX = 'test_runner_';
const TEST_RESTAURANT_ID = '7eedf081-0268-4867-af38-61fa5932420a';

export const TestDataManager = {
  /**
   * Create a temporary test user
   */
  async createTestUser() {
    const testEmail = `${TEST_PREFIX}${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test Runner User',
            is_test: true,
            restaurant_id: TEST_RESTAURANT_ID
          }
        }
      });
      
      if (error) throw error;
      
      return { success: true, user: data.user };
    } catch (err) {
      logger.error('[TestDataManager] Failed to create test user', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Create a test order with specific items
   */
  async createTestOrder(userId, items = []) {
    try {
      const orderPayload = {
        user_id: userId,
        restaurant_id: TEST_RESTAURANT_ID,
        customer_name: 'Test Runner',
        customer_email: `${TEST_PREFIX}@example.com`,
        customer_phone: '123456789',
        type: 'delivery',
        total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'pending',
        delivery_address: '123 Test St',
        created_at: new Date().toISOString()
      };

      const itemsPayload = items.map(item => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: item.price,
        status: 'pending'
      }));

      const { data, error } = await supabase.rpc('create_order_with_items', {
        p_order_data: orderPayload,
        p_items_data: itemsPayload
      });

      if (error) throw error;
      return { success: true, orderId: data.order_id };
    } catch (err) {
      logger.error('[TestDataManager] Failed to create test order', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Clean up all test data based on identifiers
   */
  async cleanupTestData() {
    try {
      let cleanedOrders = 0;
      let cleanedCustomers = 0;

      // Clean test orders
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .like('customer_name', 'Test Runner%');
      
      if (orders && orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        
        await supabase.from('order_items').update({ is_deleted: true }).in('order_id', orderIds);
        await supabase.from('delivery_orders').update({ is_deleted: true }).in('order_id', orderIds);
        await supabase.from('restaurant_orders').update({ is_deleted: true }).in('order_id', orderIds);
        
        const { count } = await supabase.from('orders').update({ is_deleted: true, status: 'cancelled' }).in('id', orderIds);
        cleanedOrders = count || orders.length;
      }

      // Clean test customers
      const { data: customers } = await supabase
        .from('customers')
        .select('id')
        .like('name', 'Test Runner%');
        
      if (customers && customers.length > 0) {
        const customerIds = customers.map(c => c.id);
        const { count } = await supabase.from('customers').update({ is_deleted: true }).in('id', customerIds);
        cleanedCustomers = count || customers.length;
      }

      return { success: true, details: `Cleaned ${cleanedOrders} orders, ${cleanedCustomers} customers` };
    } catch (err) {
      logger.error('[TestDataManager] Cleanup failed', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Verify cleanup was successful
   */
  async verifyCleanup() {
    try {
      const { count: orderCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .like('customer_name', 'Test Runner%')
        .eq('is_deleted', false);

      return { success: true, isClean: orderCount === 0, remainingCount: orderCount };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};