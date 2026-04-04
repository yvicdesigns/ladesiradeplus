import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Activity, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  REALTIME: 'realtime',
  POLLING: 'polling',
  DISCONNECTED: 'disconnected',
  ERROR: 'error'
};

export const ConnectionStatusBadge = ({ status, lastUpdate, onReconnect }) => {
  const [isLongConnecting, setIsLongConnecting] = useState(false);

  // Delay the "Reconnecting..." UI by 5 seconds to keep it silent and non-intrusive on quick reconnects
  useEffect(() => {
    let timer;
    if (status === CONNECTION_STATUS.CONNECTING) {
      timer = setTimeout(() => setIsLongConnecting(true), 5000);
    } else {
      setIsLongConnecting(false);
    }
    return () => clearTimeout(timer);
  }, [status]);

  const getStatusConfig = () => {
    switch (status) {
      case CONNECTION_STATUS.REALTIME:
        return {
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Wifi,
          label: 'Temps Réel',
          description: 'Connecté. Synchronisation instantanée active.',
          show: true
        };
      case CONNECTION_STATUS.POLLING:
        return {
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Activity,
          label: 'Polling Actif',
          description: 'Mode dégradé : actualisation toutes les 5s (Realtime indisponible).',
          show: true
        };
      case CONNECTION_STATUS.ERROR:
        return {
          color: 'bg-red-50 text-red-700 border-red-200',
          icon: AlertTriangle,
          label: 'Erreur',
          description: 'Erreur de connexion Realtime.',
          show: true
        };
      case CONNECTION_STATUS.DISCONNECTED:
        return {
          color: 'bg-gray-100 text-gray-600 border-gray-200',
          icon: WifiOff,
          label: 'Déconnecté',
          description: 'Connexion perdue avec le serveur.',
          show: true
        };
      case CONNECTION_STATUS.CONNECTING:
      default:
        return {
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: RefreshCw,
          label: 'Reconnexion...',
          description: 'Tentative de reconnexion au serveur...',
          animate: true,
          show: isLongConnecting // Only display if attempting to connect for more than 5s
        };
    }
  };

  const config = getStatusConfig();
  
  // If we are connecting quickly (less than 5s), render absolutely nothing to avoid UI flicker
  if (!config.show && status === CONNECTION_STATUS.CONNECTING) {
    return null;
  }

  // We extract the specific icon component from our config
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold transition-colors cursor-help shadow-sm ${config.color}`}>
              <StatusIcon className={`w-3.5 h-3.5 ${config.animate ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline uppercase tracking-wider">{config.label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs max-w-[200px] z-50">
            <p className="font-semibold mb-1">{config.description}</p>
            {lastUpdate && (
              <p className="text-muted-foreground text-[10px]">
                Dernière maj: {format(lastUpdate, 'HH:mm:ss', { locale: fr })}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {(status === CONNECTION_STATUS.DISCONNECTED || status === CONNECTION_STATUS.ERROR || status === CONNECTION_STATUS.POLLING) && onReconnect && (
        <Button 
          variant="outline" 
          size="sm" 
          className="h-6 px-2 text-[10px] gap-1 bg-white hover:bg-gray-50 text-gray-600 border-gray-200 shadow-sm"
          onClick={onReconnect}
        >
          <RefreshCw className="w-3 h-3" />
          <span className="hidden sm:inline">Reconnecter</span>
        </Button>
      )}
    </div>
  );
};