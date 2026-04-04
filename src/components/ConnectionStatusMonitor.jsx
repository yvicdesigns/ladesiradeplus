import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, ServerCrash } from 'lucide-react';
import { realtimeHealthCheck } from '@/lib/RealtimeHealthCheck';
import { ToastService } from '@/lib/ToastService';

export const ConnectionStatusMonitor = () => {
  const [status, setStatus] = useState(realtimeHealthCheck.getHealthStatus());

  useEffect(() => {
    realtimeHealthCheck.start();
    const unsub = realtimeHealthCheck.subscribeToStatusChanges(({ event, data }) => {
      setStatus(data);
      if (event === 'health-check-failed' && data.failureCount === 1) {
        ToastService.error('Connexion temps réel instable, passage en mode fallback (Polling).');
      } else if (event === 'health-check-passed' && data.failureCount === 0 && !data.isHealthy) {
        ToastService.success('Connexion temps réel rétablie !');
      }
    });

    return () => unsub();
  }, []);

  const handleReconnect = () => {
    ToastService.info('Tentative de reconnexion...');
    realtimeHealthCheck.performCheck();
  };

  if (status.isHealthy && status.latency < 1000) return null; // Hide if perfect

  const isPolling = !status.isHealthy;

  return (
    <div className={`fixed bottom-20 md:bottom-4 left-4 z-50 flex items-center gap-3 px-4 py-2 rounded-full shadow-lg border ${
      status.status === 'disconnected' ? 'bg-red-50 border-red-200 text-red-700' : 
      isPolling ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'
    }`}>
      {status.status === 'disconnected' ? <WifiOff className="w-4 h-4" /> : 
       isPolling ? <ServerCrash className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
       
      <span className="text-sm font-medium">
        {status.status === 'disconnected' ? 'Connexion perdue' : 
         isPolling ? 'Mode Polling (Fallback)' : 'Réseau lent'}
      </span>
      
      {!status.isHealthy && (
        <button 
          onClick={handleReconnect}
          className="ml-2 p-1 hover:bg-black/5 rounded-full transition-colors"
          title="Forcer la reconnexion"
        >
          <RefreshCw className={`w-3 h-3 ${status.status === 'reconnecting' ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
};