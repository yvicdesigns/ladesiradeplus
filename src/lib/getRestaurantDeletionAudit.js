import { supabase } from '@/lib/customSupabaseClient';
import { executeWithResilience } from '@/lib/supabaseErrorHandler';

const TARGET_TABLES = [
  'menu_items', 
  'menu_categories', 
  'orders', 
  'delivery_orders',
  'restaurant_orders', 
  'customers', 
  'tables', 
  'reservations',
  'admin_users', 
  'admin_settings', 
  'delivery_zones', 
  'promo_banners',
  'promo_codes', 
  'promotions', 
  'special_offers', 
  'banners', 
  'reviews'
];

export async function getRestaurantDeletionAudit(restaurantId) {
  if (!restaurantId) throw new Error("Restaurant ID is required");

  const results = [];
  let totalCount = 0;

  for (const table of TARGET_TABLES) {
    try {
      const count = await executeWithResilience(async () => {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', restaurantId);
        
        if (error) throw error;
        return count || 0;
      }, { context: `Auditing table ${table}`, maxRetries: 2 });

      results.push({ table, count });
      totalCount += count;
    } catch (err) {
      console.error(`Error querying ${table}:`, err);
      results.push({ table, count: -1, error: err.message });
    }
  }

  // Also check if the restaurant itself exists
  const restaurantExists = await executeWithResilience(async () => {
    const { count, error } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true })
      .eq('id', restaurantId);
    if (error) throw error;
    return (count || 0) > 0;
  });

  return {
    restaurantId,
    restaurantExists,
    totalRecords: totalCount,
    details: results
  };
}

export async function executeRestaurantDeletion(restaurantId) {
  if (!restaurantId) throw new Error("Restaurant ID is required");
  
  // Try to delete child records first to avoid foreign key constraints
  for (const table of TARGET_TABLES) {
    await executeWithResilience(async () => {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('restaurant_id', restaurantId);
      if (error) console.warn(`Error deleting from ${table}:`, error.message);
      return true;
    }, { context: `Deleting from ${table}` });
  }

  // Finally delete the restaurant
  return await executeWithResilience(async () => {
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', restaurantId);
    if (error) throw error;
    return true;
  }, { context: 'Deleting restaurant record' });
}