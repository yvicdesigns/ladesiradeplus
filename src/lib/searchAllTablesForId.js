import { supabase } from '@/lib/customSupabaseClient';

export const searchAllTablesForId = async (targetId) => {
  const tables = [
    'orders', 
    'delivery_orders', 
    'restaurant_orders', 
    'order_items', 
    'customers', 
    'profiles',
    'payments'
  ];
  const results = {};

  console.log(`🔍 Searching across all tables for ID: ${targetId}`);

  for (const table of tables) {
    try {
      results[table] = { found: false, column: null, data: null };

      // 1. Try exact 'id' match
      const { data: exactData, error: exactError } = await supabase
        .from(table)
        .select('*')
        .eq('id', targetId);

      if (exactError && exactError.code !== '42703') { // Ignore missing column 'id' errors
        console.warn(`[searchAllTablesForId] Error searching 'id' in ${table}:`, exactError);
      } else if (exactData && exactData.length > 0) {
        results[table] = { found: true, column: 'id', data: exactData[0] };
        console.log(`✅ Found in table '${table}' via column 'id'`);
        continue;
      }

      // 2. Try 'order_id' match
      if (['delivery_orders', 'restaurant_orders', 'order_items', 'payments', 'feedback', 'refunds'].includes(table)) {
        const { data: orderData, error: orderError } = await supabase
          .from(table)
          .select('*')
          .eq('order_id', targetId);

        if (orderError && orderError.code !== '42703') {
          console.warn(`[searchAllTablesForId] Error searching 'order_id' in ${table}:`, orderError);
        } else if (orderData && orderData.length > 0) {
          results[table] = { found: true, column: 'order_id', data: orderData.length === 1 ? orderData[0] : orderData };
          console.log(`✅ Found in table '${table}' via column 'order_id'`);
          continue;
        }
      }

      // 3. Try 'user_id' / 'customer_id'
      if (['customers', 'profiles'].includes(table)) {
         const col = table === 'profiles' ? 'user_id' : 'id'; 
         // Assuming if we search for a customer/user ID
         const searchCol = table === 'customers' ? 'user_id' : 'user_id';
         const { data: usrData, error: usrErr } = await supabase
          .from(table)
          .select('*')
          .eq(searchCol, targetId);

          if (!usrErr && usrData && usrData.length > 0) {
            results[table] = { found: true, column: searchCol, data: usrData[0] };
            console.log(`✅ Found in table '${table}' via column '${searchCol}'`);
          }
      }

    } catch (err) {
      console.error(`💥 Unexpected error checking table ${table}:`, err);
      results[table] = { found: false, error: err.message };
    }
  }

  return results;
};