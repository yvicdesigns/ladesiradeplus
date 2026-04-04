import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Helper hook to monitor Supabase Realtime connection health
 * Can be used by components to show system status
 */
export const useRealtimeOrderTracking = (channelName) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [retryCount, setRetryCount] = useState(0);
  
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!channelName) return;

    const connect = () => {
      const channel = supabase.channel(channelName)
        .subscribe((status) => {
          setConnectionState(status);
          
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setRetryCount(0); // Reset retries on success
          } else {
            setIsConnected(false);
            
            if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              // Exponential backoff for reconnection
              const delay = Math.min(1000 * Math.pow(2, retryCount), 8000); // 1s, 2s, 4s, 8s max
              
              console.log(`[REALTIME_MONITOR] Connection lost (${status}). Retrying in ${delay}ms...`);
              
              if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
              
              reconnectTimeoutRef.current = setTimeout(() => {
                setRetryCount(prev => prev + 1);
                // Triggering a re-render or re-effect is tricky here without external trigger
                // usually removeChannel + new channel is needed
                supabase.removeChannel(channel);
                connect(); 
              }, delay);
            }
          }
        });

      return channel;
    };

    const channel = connect();

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [channelName, retryCount]);

  return {
    isConnected,
    connectionState
  };
};