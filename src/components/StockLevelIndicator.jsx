import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export const StockLevelIndicator = ({ stock, minStock = 5 }) => {
  const currentStock = stock || 0;
  const isOutOfStock = currentStock <= 0;
  const isLowStock = currentStock > 0 && currentStock <= minStock;

  let colorClass = 'bg-amber-100 text-amber-800 border-amber-200';
  let Icon = CheckCircle;
  let label = 'En Stock';

  if (isOutOfStock) {
    colorClass = 'bg-red-100 text-red-800 border-red-200';
    Icon = XCircle;
    label = 'Rupture';
  } else if (isLowStock) {
    colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
    Icon = AlertTriangle;
    label = 'Stock Faible';
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`gap-1 cursor-help ${colorClass}`}>
            <Icon className="w-3 h-3" />
            {label} ({currentStock})
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-bold">Quantité actuelle: {currentStock}</p>
          <p className="text-xs opacity-80">Seuil de base: {minStock}</p>
          {isLowStock && <p className="text-xs text-yellow-500 mt-1">Attention: Stock sous le seuil d'alerte.</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};