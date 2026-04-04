import { supabase } from '@/lib/customSupabaseClient';

// The 14 constraints that were modified in the migration
export const TARGET_CONSTRAINTS = [
  'special_hours_event_id_fkey',
  'customer_feedback_customer_id_fkey',
  'deliveries_customer_id_fkey',
  'payments_customer_id_fkey',
  'customer_feedback_category_id_fkey',
  'purchase_order_items_ingredient_id_fkey',
  'stock_movements_ingredient_id_fkey',
  'promo_banners_linked_product_id_fkey',
  'promo_banners_product_id_fkey',
  'reviews_menu_item_id_fkey',
  'orders_promo_code_id_fkey',
  'ingredients_supplier_id_fkey',
  'purchase_orders_supplier_id_fkey',
  'orders_table_id_fkey'
];

/**
 * Queries the database via RPC (which queries information_schema)
 * to verify that the 14 targeted constraints now use CASCADE.
 */
export const verifyForeignKeyMigration = async () => {
  try {
    const { data, error } = await supabase.rpc('get_all_foreign_keys');
    
    if (error) {
      console.error('Error fetching foreign keys:', error);
      throw error;
    }

    // Filter down to just our target constraints
    const results = TARGET_CONSTRAINTS.map(constraintName => {
      const fk = data.find(f => f.constraint_name === constraintName);
      
      if (!fk) {
        return {
          constraint_name: constraintName,
          table_name: 'UNKNOWN',
          delete_rule: 'NOT FOUND',
          isCascade: false,
          status: '✗'
        };
      }

      return {
        constraint_name: fk.constraint_name,
        table_name: fk.child_table,
        parent_table: fk.parent_table,
        delete_rule: fk.delete_rule,
        isCascade: fk.delete_rule === 'CASCADE',
        status: fk.delete_rule === 'CASCADE' ? '✓' : '✗'
      };
    });

    const allPassed = results.every(r => r.isCascade);

    return {
      success: true,
      allPassed,
      results
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      results: []
    };
  }
};