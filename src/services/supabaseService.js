import { supabase } from '@/lib/customSupabaseClient';
import { applyIsDeletedFilter } from '@/lib/softDeleteUtils';
import { withTimeout, retryWithExponentialBackoff } from '@/lib/networkResilience';
import { TIMEOUT_CONFIG } from '@/lib/timeoutConfig';

export const supabaseService = {
  async fetch(table, options = {}) {
    try {
      const executeQuery = async () => {
        let query = supabase.from(table).select(options.select || '*');
        
        query = applyIsDeletedFilter(query, options.includeDeleted || false, table);
        
        if (options.eq) {
          Object.entries(options.eq).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        
        if (options.order) {
          query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
        }

        if (options.limit) {
          query = query.limit(options.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
      };

      const result = await retryWithExponentialBackoff(async () => {
        return await withTimeout(executeQuery, TIMEOUT_CONFIG.QUERY_TIMEOUT);
      });

      if (!result.success) throw result.error;

      return { data: result.data, error: null };
    } catch (error) {
      console.error(`[Supabase Fetch Error] ${table}:`, error);
      return { data: null, error };
    }
  }
};