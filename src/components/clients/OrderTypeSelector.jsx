import React from 'react';
import { Button } from '@/components/ui/button';
import { Utensils, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

export const OrderTypeSelector = ({ value, onChange }) => {
  return (
    <div className="flex bg-gray-100 p-1 rounded-xl w-full max-w-md mx-auto">
      <Button
        type="button"
        variant="ghost"
        className={cn(
          "flex-1 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 h-12",
          value === 'dine_in' 
            ? "bg-white text-amber-600 shadow-sm font-bold" 
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
        )}
        onClick={() => onChange('dine_in')}
      >
        <Utensils className="w-5 h-5" />
        <span>Sur place</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        className={cn(
          "flex-1 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 h-12",
          value === 'delivery' 
            ? "bg-white text-blue-600 shadow-sm font-bold" 
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
        )}
        onClick={() => onChange('delivery')}
      >
        <Truck className="w-5 h-5" />
        <span>Livraison</span>
      </Button>
    </div>
  );
};