import React, { useState, useEffect } from 'react';
import { Clock, Timer } from 'lucide-react';
import { differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

export const ETADisplay = ({ eta, status }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isDelayed, setIsDelayed] = useState(false);

  useEffect(() => {
    if (!eta) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const etaDate = new Date(eta);
      const diff = differenceInMinutes(etaDate, now);

      if (diff < 0) {
        setIsDelayed(true);
        setTimeLeft('En retard');
      } else if (diff < 60) {
        setTimeLeft(`${diff} min`);
        setIsDelayed(false);
      } else {
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        setTimeLeft(`${hours}h ${mins}min`);
        setIsDelayed(false);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [eta]);

  const isComplete = ['delivered', 'completed', 'cancelled'].includes(status);

  if (isComplete) return null;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all",
      isDelayed ? "bg-red-50 border-red-100 text-red-800" : "bg-blue-50 border-blue-100 text-blue-900"
    )}>
      <div className="flex items-center gap-1 mb-0.5 opacity-80">
        <Clock className="w-3 h-3" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Temps Estimé</span>
      </div>
      
      <div className="text-lg font-bold tracking-tight my-0.5 leading-none">
        {timeLeft || '--'}
      </div>

      <div className="text-[10px] opacity-75 flex flex-wrap justify-center items-center gap-1 leading-tight">
        {eta ? new Date(eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
        <span className="text-[9px]">(±10 min)</span>
      </div>
    </div>
  );
};