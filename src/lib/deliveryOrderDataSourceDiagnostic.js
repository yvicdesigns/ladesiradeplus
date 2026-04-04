import { supabase } from '@/lib/customSupabaseClient';

export const findDeliveryOrderDataSource = async (targetId = '74565dc7-ea8f-4556-8c45-73701a35b17c') => {
  console.log(`\n======================================================`);
  console.log(`🔍 [DATA SOURCE DIAGNOSTIC] Analyzing Target ID: ${targetId}`);
  console.log(`======================================================\n`);

  const results = {
    summary: {
      targetId,
      foundInDeliveryOrders: false,
      foundInOrders: false,
      foundInRestaurantOrders: false,
      containingTables: []
    },
    queries: {}
  };

  const executeQuery = async (queryKey, queryName, queryPromise) => {
    console.log(`▶️ Executing: ${queryName}`);
    try {
      const { data, error } = await queryPromise;
      
      const count = data ? data.length : 0;
      const columns = count > 0 ? Object.keys(data[0]) : [];
      
      console.log(`   └─ Rows returned: ${count}`);
      if (count > 0) {
        console.log(`   └─ Columns: ${columns.join(', ')}`);
        console.log(`   └─ Data:`, data);
      }
      
      if (error) {
        console.error(`   └─ ❌ Error:`, error);
      }

      results.queries[queryKey] = {
        name: queryName,
        data: data || [],
        count,
        columns,
        error: error ? error.message : null
      };

      return data;
    } catch (err) {
      console.error(`   └─ 💥 Unexpected Exception:`, err);
      results.queries[queryKey] = {
        name: queryName,
        data: [],
        count: 0,
        columns: [],
        error: err.message
      };
      return null;
    }
  };

  // Query 1: SELECT * FROM delivery_orders WHERE id = targetId
  const q1Data = await executeQuery(
    'q1',
    `SELECT * FROM delivery_orders WHERE id = '${targetId}'`,
    supabase.from('delivery_orders').select('*').eq('id', targetId)
  );
  if (q1Data && q1Data.length > 0) {
    results.summary.foundInDeliveryOrders = true;
    results.summary.containingTables.push('delivery_orders');
  }

  // Query 2: SELECT * FROM orders WHERE id = targetId
  const q2Data = await executeQuery(
    'q2',
    `SELECT * FROM orders WHERE id = '${targetId}'`,
    supabase.from('orders').select('*').eq('id', targetId)
  );
  if (q2Data && q2Data.length > 0) {
    results.summary.foundInOrders = true;
    results.summary.containingTables.push('orders');
  }

  // Query 3: SELECT * FROM restaurant_orders WHERE id = targetId
  const q3Data = await executeQuery(
    'q3',
    `SELECT * FROM restaurant_orders WHERE id = '${targetId}'`,
    supabase.from('restaurant_orders').select('*').eq('id', targetId)
  );
  if (q3Data && q3Data.length > 0) {
    results.summary.foundInRestaurantOrders = true;
    results.summary.containingTables.push('restaurant_orders');
  }

  // Query 4: SELECT * FROM delivery_orders LIMIT 1
  await executeQuery(
    'q4',
    `SELECT * FROM delivery_orders LIMIT 1`,
    supabase.from('delivery_orders').select('*').limit(1)
  );

  // Query 5: SELECT * FROM orders LIMIT 1
  await executeQuery(
    'q5',
    `SELECT * FROM orders LIMIT 1`,
    supabase.from('orders').select('*').limit(1)
  );

  console.log(`\n📊 [DIAGNOSTIC SUMMARY]`);
  console.log(`Target ID ${targetId} is found in tables: ${results.summary.containingTables.join(', ') || 'NONE'}`);
  console.log(`======================================================\n`);

  return results;
};