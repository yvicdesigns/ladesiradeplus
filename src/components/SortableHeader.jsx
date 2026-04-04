import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SortableHeader = ({ 
  columnName, 
  currentSort, 
  currentOrder, 
  onSort, 
  label, 
  className 
}) => {
  const isActive = currentSort === columnName;

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onSort(columnName)}
              className={cn(
                "flex items-center gap-1.5 text-sm font-bold transition-colors hover:text-primary focus:outline-none group",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {label}
              <span className="flex flex-col items-center justify-center w-4 h-4">
                {isActive ? (
                  currentOrder === 'asc' ? (
                    <ArrowUp className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDown className="h-3.5 w-3.5" />
                  )
                ) : (
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-50" />
                )}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>
              {isActive 
                ? `Trier par ordre ${currentOrder === 'asc' ? 'décroissant' : 'croissant'}`
                : "Trier par cette colonne"
              }
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default SortableHeader;