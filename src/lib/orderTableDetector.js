import { supabase } from '@/lib/customSupabaseClient';

/**
 * Detects which table an order ID actually belongs to.
 * This is crucial for environments where order IDs might be mixed up 
 * or stored in a base 'orders' table rather than 'delivery_orders'.
 */
export const detectOrderTable = async (id) => {
  const tablesToSearch = ['delivery_orders', 'restaurant_orders', 'orders'];
  
  console.log(`[OrderTableDetector] 🔍 Searching for origin table of ID: ${id}`);
  
  for (const table of tablesToSearch) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .eq('id', id)
        .limit(1);
        
      if (!error && data && data.length > 0) {
        console.log(`[OrderTableDetector] ✅ Found ID ${id} in table: ${table}`);
        return table;
      }
    } catch (err) {
      console.warn(`[OrderTableDetector] ⚠️ Error checking table ${table}:`, err);
    }
  }
  
  console.log(`[OrderTableDetector] ❌ ID ${id} not found in any standard order tables.`);
  return null;
};