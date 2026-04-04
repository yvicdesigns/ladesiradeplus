import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LoadingState = ({ message = "Chargement en cours...", className, fullScreen = false }) => {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-8 text-muted-foreground",
        fullScreen ? "min-h-screen bg-background" : "min-h-[200px] w-full",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
      <p className="text-sm font-medium animate-pulse">{message}</p>
    </div>
  );
};

export default LoadingState;