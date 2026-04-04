import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [networkInfo, setNetworkInfo] = useState({
    isOnline: navigator.onLine,
    lastConnected: navigator.onLine ? new Date() : null,
  });

  useEffect(() => {
    const handleOnline = () => {
      console.log('[NetworkStatus] Device is ONLINE');
      setNetworkInfo({
        isOnline: true,
        lastConnected: new Date(),
      });
    };
    
    const handleOffline = () => {
      console.warn('[NetworkStatus] Device is OFFLINE');
      setNetworkInfo(prev => ({
        ...prev,
        isOnline: false,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return networkInfo.isOnline; // Kept as boolean for backward compatibility with existing components
}

export function useDetailedNetworkStatus() {
  const [networkInfo, setNetworkInfo] = useState({
    isOnline: navigator.onLine,
    lastConnected: navigator.onLine ? new Date() : null,
  });

  useEffect(() => {
    const handleOnline = () => {
      setNetworkInfo({ isOnline: true, lastConnected: new Date() });
    };
    const handleOffline = () => {
      setNetworkInfo(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return networkInfo;
}