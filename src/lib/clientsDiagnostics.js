import { supabase } from '@/lib/customSupabaseClient';

/**
 * Runs a diagnostic check on the customers table to identify data distribution
 * across different restaurant_ids and checks for deleted vs active records.
 */
export const runClientsDiagnostic = async () => {
  try {
    console.log('[Diagnostics] Starting clients diagnostic run...');
    
    // Fetch all customers without any filters to get a complete picture
    const { data, error } = await supabase
      .from('customers')
      .select('id, restaurant_id, is_deleted, created_at');
      
    if (error) {
      console.error('[Diagnostics] Error fetching customers:', error);
      throw error;
    }

    if (!data) {
      return { success: true, total: 0, groups: {}, message: 'No data returned from customers table.' };
    }

    const total = data.length;
    const groups = {};
    
    data.forEach(client => {
      const rId = client.restaurant_id || 'NULL_OR_MISSING';
      if (!groups[rId]) {
        groups[rId] = { count: 0, active: 0, deleted: 0 };
      }
      
      groups[rId].count++;
      
      if (client.is_deleted) {
        groups[rId].deleted++;
      } else {
        groups[rId].active++;
      }
    });

    let maxId = null;
    let maxCount = -1;
    
    Object.entries(groups).forEach(([id, stats]) => {
      if (stats.count > maxCount) {
        maxCount = stats.count;
        maxId = id;
      }
    });

    console.log('[Diagnostics] Run complete.', { total, groups, maxId, maxCount });
    
    return {
      success: true,
      total,
      groups,
      maxId,
      maxCount,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('[Diagnostics] Failed:', err);
    return { 
      success: false, 
      error: err.message || 'Unknown error occurred during diagnostic' 
    };
  }
};