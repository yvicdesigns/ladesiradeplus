import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useConnectionStatus = (intervalMs = 30000) => {
  const [isConnected, setIsConnected] = useState(true);
  const [lastChecked, setLastChecked] = useState(new Date());
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const checkConnection = async () => {
      if (!isMounted.current) return;
      
      try {
        // Lightweight query to check connection
        const { error: err } = await supabase.from('menu_categories').select('id').limit(1);
        
        if (!isMounted.current) return;
        
        if (err) {
          console.warn('[ConnectionStatus] Health check failed:', err.message);
          setIsConnected(false);
          setError(err);
        } else {
          setIsConnected(true);
          setError(null);
        }
      } catch (err) {
        if (!isMounted.current) return;
        console.warn('[ConnectionStatus] Health check caught error:', err.message);
        setIsConnected(false);
        setError(err);
      } finally {
        if (isMounted.current) {
          setLastChecked(new Date());
        }
      }
    };

    // Initial check
    checkConnection();

    // Setup interval
    const intervalId = setInterval(checkConnection, intervalMs);

    // Online/Offline listeners
    const handleOnline = () => checkConnection();
    const handleOffline = () => {
      setIsConnected(false);
      setError(new Error('Browser is offline'));
      setLastChecked(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isMounted.current = false;
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [intervalMs]);

  return { isConnected, lastChecked, error };
};