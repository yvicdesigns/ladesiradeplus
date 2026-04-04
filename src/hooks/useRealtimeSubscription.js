import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { logSupabaseError } from '@/lib/supabaseErrorHandler';
import { ensureArray } from '@/lib/dataValidation';
import { retryWithExponentialBackoff, withTimeout } from '@/lib/networkResilience';
import { logger } from '@/lib/logger';

const MAX_RETRIES = 3;
const DEBOUNCE_MS = 500; 
const FETCH_TIMEOUT_MS = 15000; 

export const useRealtimeSubscription = (tableName, options = {}, selectQuery = '*') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('CONNECTING');
  const [retryCount, setRetryCount] = useState(0);
  
  const channelRef = useRef(null);
  const isMounted = useRef(true);
  const realtimeDebounceRef = useRef(null);
  const isFetchingRef = useRef(false);
  
  const currentDataStringRef = useRef('[]');
  // Guard: only stringify plain objects; functions/null/undefined all become '{}'
  const optionsStr = (options && typeof options === 'object' && !Array.isArray(options))
    ? JSON.stringify(options)
    : '{}';

  const fetchData = useCallback(async (isManualRetry = false) => {
    if (!isMounted.current) return;
    
    if (isFetchingRef.current) {
      logger.debug(`[RealtimeSubscription:${tableName}] Fetch already in progress. Skipping.`);
      return;
    }
    
    if (isManualRetry) {
      setRetryCount(0);
      setError(null);
    }
    
    isFetchingRef.current = true;
    if (data.length === 0) setLoading(true);
    
    const parsedOptions = JSON.parse(optionsStr);

    try {
      logger.debug(`Hook initialized: useRealtimeSubscription(${tableName}), Status: Fetching`);
      
      const result = await retryWithExponentialBackoff(async () => {
        let query = supabase.from(tableName).select(selectQuery);
        
        if (parsedOptions?.filter) {
          Object.entries(parsedOptions.filter).forEach(([key, value]) => {
             query = query.eq(key, value);
          });
        }
        if (parsedOptions?.orderBy) {
           query = query.order(parsedOptions.orderBy.column || 'created_at', { ascending: parsedOptions.orderBy.ascending ?? false });
        } else {
           query = query.order('created_at', { ascending: false });
        }
        if (parsedOptions?.limit) {
           query = query.limit(parsedOptions.limit);
        }

        // FIX: Wrap the Supabase query in a function to satisfy withTimeout's expectation of a promiseFn
        const { data: qData, error: qError } = await withTimeout(async () => await query, FETCH_TIMEOUT_MS);
        if (qError) throw qError;
        return qData;
      }, MAX_RETRIES, 1000);

      if (!result.success) {
        throw result.error;
      }
      
      if (isMounted.current) {
        const safeData = ensureArray(result.data);
        const newStringifiedData = JSON.stringify(safeData);
        
        if (newStringifiedData !== currentDataStringRef.current) {
          logger.debug(`[RealtimeSubscription:${tableName}] Data updated. Count: ${safeData.length}.`);
          currentDataStringRef.current = newStringifiedData;
          setData(safeData);
        }
        
        setRetryCount(result.attempts - 1);
        setError(null);
      }
    } catch (err) {
      logSupabaseError(err, `useRealtimeSubscription: ${tableName}`);
      logger.error(`Realtime subscription fetch error [${tableName}]:`, err);
      if (isMounted.current) {
        const enhancedError = new Error(
          err.message === 'Failed to fetch' || err.message?.includes('network') 
            ? `Erreur de connexion lors du chargement de ${tableName}.` 
            : `Erreur: ${err.message}`
        );
        enhancedError.original = err;
        setError(enhancedError);
        setRetryCount(MAX_RETRIES);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        isFetchingRef.current = false;
      }
    }
  }, [tableName, optionsStr, selectQuery]);

  useEffect(() => {
    isMounted.current = true;
    logger.info(`Hook initialized: useRealtimeSubscription for ${tableName}`);
    fetchData();

    if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
    }

    const channelName = `public:${tableName}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, () => {
        if (!isMounted.current) return;
        
        if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
        realtimeDebounceRef.current = setTimeout(() => {
          logger.debug(`[RealtimeSubscription:${tableName}] Realtime update. Refetching...`);
          isFetchingRef.current = false; 
          fetchData();
        }, DEBOUNCE_MS);
      })
      .subscribe((subStatus) => {
        if (!isMounted.current) return;
        setStatus(subStatus);
        if (subStatus === 'CHANNEL_ERROR') {
          logger.error(`Realtime subscription channel error [${tableName}]`);
        }
      });

    channelRef.current = channel;

    return () => {
      isMounted.current = false;
      if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).catch(e => logger.error("Cleanup channel", e));
        channelRef.current = null;
      }
    };
  }, [fetchData, tableName]);

  return { 
    data: ensureArray(data), 
    loading, 
    error, 
    status,
    retryCount,
    refetch: () => {
      isFetchingRef.current = false;
      return fetchData(true);
    }
  };
};