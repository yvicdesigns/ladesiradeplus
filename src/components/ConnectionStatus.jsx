import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export const ConnectionStatus = ({ isConnected, onRetry, className = "" }) => {
  if (isConnected) {
    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200 ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <span className="ml-1 hidden sm:inline">Live Connected</span>
        <Wifi className="w-3 h-3 sm:hidden" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200 ${className}`}>
      <WifiOff className="h-3 w-3" />
      <span className="hidden sm:inline">Disconnected</span>
      {onRetry && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-4 w-4 ml-1 hover:bg-red-100 p-0" 
          onClick={onRetry}
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};