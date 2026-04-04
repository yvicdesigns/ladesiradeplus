import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const DeleteButton = ({ onClick, disabled, loading, tooltip = "Supprimer ce record", className = "" }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled && !loading && onClick) onClick(e);
            }}
            disabled={disabled || loading}
            className={`
              h-8 w-8 transition-colors
              ${disabled 
                ? 'opacity-50 cursor-not-allowed text-gray-400' 
                : 'text-[#EF4444] hover:bg-red-50 hover:text-red-700'
              }
              ${className}
            `}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{disabled ? "Permission refusée" : tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};