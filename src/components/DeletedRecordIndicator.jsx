import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RotateCcw, Loader2 } from 'lucide-react';

export const DeletedRecordIndicator = ({ onRestore, isRestoring, children }) => {
  return (
    <div className="relative group bg-gray-50 text-gray-500 rounded-lg overflow-hidden border border-gray-200 my-1">
      <div className="opacity-60 grayscale-[50%] pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 bg-white/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-200 flex items-center gap-4 transform translate-y-4 group-hover:translate-y-0 transition-transform pointer-events-auto">
          <Badge variant="secondary" className="bg-gray-200 text-gray-700 font-semibold border-gray-300">
            Supprimé
          </Badge>
          {onRestore && (
            <Button 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                if (onRestore) onRestore();
              }} 
              disabled={isRestoring}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Restaurer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};