import React from 'react';
import { Button } from '@/components/ui/button';
import { Utensils, Truck, ListFilter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export const OrderTypeFilter = ({ currentFilter, onFilterChange, counts = {} }) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={currentFilter === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('all')}
        className={cn(
          "h-9 rounded-full px-4 font-medium transition-colors",
          currentFilter === 'all' ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-white text-gray-600 border-gray-200"
        )}
      >
        <ListFilter className="w-4 h-4 mr-2" />
        Toutes
        {counts.all !== undefined && (
          <Badge variant="secondary" className="ml-2 bg-white/20 text-current hover:bg-white/20 border-none px-1.5 min-w-[20px] justify-center">
            {counts.all}
          </Badge>
        )}
      </Button>

      <Button
        variant={currentFilter === 'dine_in' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('dine_in')}
        className={cn(
          "h-9 rounded-full px-4 font-medium transition-colors",
          currentFilter === 'dine_in' ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 hover:text-amber-800" : "bg-white text-gray-600 border-gray-200"
        )}
      >
        <Utensils className="w-4 h-4 mr-2" />
        Sur place
        {counts.dine_in !== undefined && (
          <Badge variant="secondary" className={cn("ml-2 border-none px-1.5 min-w-[20px] justify-center", currentFilter === 'dine_in' ? "bg-amber-200 text-amber-800" : "bg-gray-100")}>
            {counts.dine_in}
          </Badge>
        )}
      </Button>

      <Button
        variant={currentFilter === 'delivery' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('delivery')}
        className={cn(
          "h-9 rounded-full px-4 font-medium transition-colors",
          currentFilter === 'delivery' ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 hover:text-blue-800" : "bg-white text-gray-600 border-gray-200"
        )}
      >
        <Truck className="w-4 h-4 mr-2" />
        Livraison
        {counts.delivery !== undefined && (
          <Badge variant="secondary" className={cn("ml-2 border-none px-1.5 min-w-[20px] justify-center", currentFilter === 'delivery' ? "bg-blue-200 text-blue-800" : "bg-gray-100")}>
            {counts.delivery}
          </Badge>
        )}
      </Button>
    </div>
  );
};