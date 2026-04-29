import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { realtimeHealthCheck } from '@/lib/RealtimeHealthCheck';
import { pollingService } from '@/lib/PollingService';

export const CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  REALTIME: 'realtime',
  POLLING: 'polling',
  DISCONNECTED: 'disconnected',
  ERROR: 'error'
};

const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 4000;

// Module-level cache shared across all hook instances and page navigations
// key → { data, timestamp }
const memoryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) { memoryCache.delete(key); return null; }
  return entry.data;
}

function setCache(key, data) {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

export function useRealtimeWithFallback({
  key,
  channelName,
  table,
  schema = 'public',
  filter,
  event = '*',
  fetchData,
  pollingInterval = 120000,
  maxRetries = 3,
  enabled = true
}) {
  const cached = key ? getCached(key) : null;
  const [data, setData] = useState(cached);
  const [loading, setLoading] = useState(!cached); // no spinner if we have cache
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(enabled ? CONNECTION_STATUS.CONNECTING : CONNECTION_STATUS.DISCONNECTED);
  
  const channelRef = useRef(null);
  const isMounted = useRef(true);
  const retryCountRef = useRef(0);
  const isConnectingRef = useRef(false);
  const lastUpdateRef = useRef(0);
  const connectionStatusRef = useRef(enabled ? CONNECTION_STATUS.CONNECTING : CONNECTION_STATUS.DISCONNECTED);

  const fetchCallback = useCallback(async () => {
    if (!fetchData || !isMounted.current) return;
    try {
      const now = Date.now();
      if (now - lastUpdateRef.current < 1000) return;
      lastUpdateRef.current = now;

      const result = await fetchData();
      if (isMounted.current && result !== undefined) {
        setData(result);
        setError(null);
        if (key) setCache(key, result); // persist in module cache
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err);
        console.error(`[RealtimeFallback] Fetch error for ${channelName}:`, err);
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [fetchData, channelName, key]);

  const startPollingFallback = useCallback(() => {
    if (!enabled || !isMounted.current) return;
    connectionStatusRef.current = CONNECTION_STATUS.POLLING;
    setConnectionStatus(CONNECTION_STATUS.POLLING);
    const adaptiveInterval = realtimeHealthCheck.healthScore < 50 ? pollingInterval * 2 : pollingInterval;
    // Cap minimum polling interval to 2000ms to prevent spam, but normally uses the 2-minute interval
    pollingService.startPolling(key || channelName, fetchCallback, Math.max(adaptiveInterval, 2000));
  }, [enabled, key, channelName, fetchCallback, pollingInterval]);

  const stopPollingFallback = useCallback(() => {
    pollingService.stopPolling(key || channelName);
  }, [key, channelName]);

  const connectRealtime = useCallback(() => {
    if (!isMounted.current || !enabled || isConnectingRef.current) return;
    
    // Circuit breaker for connection attempts
    if (retryCountRef.current > maxRetries) {
      console.warn(`[RealtimeFallback] Max retries (${maxRetries}) reached for ${channelName}. Switching to polling.`);
      startPollingFallback();
      return;
    }

    isConnectingRef.current = true;
    setConnectionStatus(CONNECTION_STATUS.CONNECTING);
    stopPollingFallback();
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current).catch(() => {});
    }

    const stableChannelName = `${channelName}-${table}-events`;
    const channel = supabase.channel(stableChannelName);
    
    let filterConfig = { event, schema, table };
    if (filter) filterConfig.filter = filter;

    channel
      .on('postgres_changes', filterConfig, () => {
        fetchCallback();
      })
      .subscribe((status, err) => {
        if (!isMounted.current) return;
        
        isConnectingRef.current = false;
        
        if (status === 'SUBSCRIBED') {
          connectionStatusRef.current = CONNECTION_STATUS.REALTIME;
          setConnectionStatus(CONNECTION_STATUS.REALTIME);
          retryCountRef.current = 0;
          fetchCallback(); 
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          retryCountRef.current += 1;
          if (retryCountRef.current <= maxRetries) {
            const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCountRef.current - 1), MAX_RETRY_DELAY);
            setTimeout(() => connectRealtime(), delay);
          } else {
            startPollingFallback();
          }
        }
      });

    channelRef.current = channel;
  }, [channelName, table, schema, event, filter, maxRetries, startPollingFallback, stopPollingFallback, fetchCallback, enabled]);

  useEffect(() => {
    isMounted.current = true;
    
    if (enabled) {
      realtimeHealthCheck.start();
      
      const unsubHealth = realtimeHealthCheck.subscribeToStatusChanges(({ event }) => {
        if (!isMounted.current) return;
        if (event === 'health-check-passed' && connectionStatusRef.current === CONNECTION_STATUS.POLLING) {
           retryCountRef.current = 0;
           connectRealtime();
        } else if (event === 'health-check-failed' && connectionStatusRef.current === CONNECTION_STATUS.REALTIME) {
           startPollingFallback();
        }
      });

      // Fetch data immediately — don't wait for WebSocket to connect
      // WebSocket will trigger re-fetches on live changes
      fetchCallback();
      connectRealtime();

      return () => {
        isMounted.current = false;
        unsubHealth();
        stopPollingFallback();
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current).catch(() => {});
        }
      };
    } else {
      setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
      stopPollingFallback();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).catch(() => {});
      }
    }
  }, [enabled, connectRealtime, stopPollingFallback, startPollingFallback]);

  return {
    data,
    loading,
    error,
    connectionStatus,
    isUsingFallback: connectionStatus === CONNECTION_STATUS.POLLING,
    refetch: fetchCallback,
    reconnect: () => {
      retryCountRef.current = 0;
      connectRealtime();
    }
  };
}