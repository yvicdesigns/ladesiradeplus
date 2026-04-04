import { searchAllTablesForId } from './searchAllTablesForId';
import { getTableStructure } from './getTableStructure';

export const logDeliveryOrderTrace = async (targetId) => {
  console.log(`\n======================================================`);
  console.log(`🔍 [TRACE START] Tracing Data Flow for ID: ${targetId}`);
  console.log(`======================================================\n`);

  try {
    console.log(`[1/3] Searching across core tables...`);
    const searchResults = await searchAllTablesForId(targetId);
    
    console.table(
      Object.entries(searchResults).map(([table, result]) => ({
        Table: table,
        Found: result.found ? '✅ YES' : '❌ NO',
        MatchColumn: result.column || 'N/A',
        HasError: result.error ? '⚠️ YES' : 'NO'
      }))
    );

    console.log(`\n[2/3] Extracting Raw Lineage Data...`);
    Object.entries(searchResults).forEach(([table, result]) => {
      if (result.found) {
        console.log(`\n📄 DATA FROM [${table}] matched via [${result.column}]:`);
        console.dir(result.data, { depth: null });
      }
    });

    console.log(`\n[3/3] Analyzing 'delivery_orders' schema structure...`);
    const schema = await getTableStructure('delivery_orders');
    console.log(`📋 Columns in delivery_orders:`, schema.columns.map(c => `${c.column_name} (${c.data_type})`));
    if (schema.foreignKeys && schema.foreignKeys.length > 0) {
      console.log(`🔗 Foreign Keys in delivery_orders:`, schema.foreignKeys);
    } else {
      console.log(`🔗 No foreign keys explicitly detected via RPC for delivery_orders.`);
    }

    console.log(`\n💡 [SUMMARY]`);
    const foundTables = Object.entries(searchResults).filter(([_, r]) => r.found).map(([t]) => t);
    console.log(`Order data exists across: ${foundTables.join(', ') || 'NONE'}`);
    
    console.log(`\n📝 [MOCK QUERY] Equivalent query needed to fetch full lineage:`);
    console.log(`
      supabase
        .from('orders')
        .select(\`
          *,
          delivery_orders (*),
          restaurant_orders (*),
          order_items (*)
        \`)
        .eq('id', '${targetId}')
    `);
    
    console.log(`\n======================================================`);
    console.log(`✅ [TRACE COMPLETE]`);
    console.log(`======================================================\n`);

    return searchResults;
  } catch (err) {
    console.error(`💥 Trace failed:`, err);
  }
};

// Make globally available in window for immediate console debugging
if (typeof window !== 'undefined') {
  window.logDeliveryOrderTrace = logDeliveryOrderTrace;
  console.log(`🛠️ [DEBUG UTILS] Available globally: window.logDeliveryOrderTrace('uuid')`);
}