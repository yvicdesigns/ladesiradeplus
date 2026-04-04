import { supabase } from './customSupabaseClient';

/**
 * Utilities for batching requests.
 */

// Simple deduplication map
const pendingRequests = new Map();

/**
 * Deduplicates identical pending requests.
 * If 5 components ask for "user_123" at the same time, only 1 request is made.
 */
export const fetchDeduplicated = async (key, fetcher) => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = fetcher().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
};

/**
 * Batches multiple ID lookups into a single .in() query
 * (Simplified implementation - normally requires a complex queue system)
 */
export const createBatchFetcher = (table, idField = 'id', batchTime = 50) => {
  let queue = [];
  let timeout = null;
  let resolvers = new Map();

  const flush = async () => {
    const idsToFetch = [...new Set(queue)];
    queue = [];
    timeout = null;

    if (idsToFetch.length === 0) return;

    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .in(idField, idsToFetch);

      // Resolve promises
      idsToFetch.forEach(id => {
        const item = data?.find(d => d[idField] === id);
        const resolver = resolvers.get(id);
        if (resolver) {
            if (error) resolver.reject(error);
            else resolver.resolve(item || null);
            resolvers.delete(id);
        }
      });
    } catch (err) {
       idsToFetch.forEach(id => {
           const resolver = resolvers.get(id);
           if (resolver) {
               resolver.reject(err);
               resolvers.delete(id);
           }
       });
    }
  };

  return (id) => {
    return new Promise((resolve, reject) => {
      if (resolvers.has(id)) {
          // Hook into existing promise if complex logic allowed, simpler to just overwrite for now
          // or ideally, use the deduplicator above
      }
      
      resolvers.set(id, { resolve, reject });
      queue.push(id);

      if (!timeout) {
        timeout = setTimeout(flush, batchTime);
      }
    });
  };
};