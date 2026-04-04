import React, { useState, useRef, useCallback } from 'react';
import { useSoftDelete } from '@/hooks/useSoftDelete';
import { toast } from '@/components/ui/use-toast';
import { ToastService } from '@/lib/ToastService';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { AUDIT_ACTIONS } from '@/constants/AUDIT_ACTIONS';

export const useDeleteWithUndo = (tableName, onRefresh) => {
  const { deleteRecord: softDelete, restoreRecord, loading: isSoftDeleting } = useSoftDelete(tableName);
  const [isDeleting, setIsDeleting] = useState(false);
  const undoTimeouts = useRef({});

  const undoDelete = useCallback(async (recordId) => {
    if (undoTimeouts.current[recordId]) {
      clearTimeout(undoTimeouts.current[recordId]);
      delete undoTimeouts.current[recordId];
    }
    
    setIsDeleting(true);
    const { success } = await restoreRecord(recordId, "Annulation de la suppression");
    setIsDeleting(false);
    
    if (success) {
      ToastService.info("Données restaurées", "Information");
      if (onRefresh) onRefresh();
    } else {
      ToastService.error("Erreur lors de la restauration", "Erreur");
    }
  }, [restoreRecord, onRefresh]);

  const deleteRecord = async (recordId, reason = null) => {
    setIsDeleting(true);
    const { success } = await softDelete(recordId, reason);
    setIsDeleting(false);

    if (success) {
      const { id: toastId, dismiss } = toast({
        title: "Élément supprimé",
        description: "L'élément a été placé dans la corbeille.",
        className: "bg-gray-900 text-white border-gray-800",
        duration: 10000,
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-transparent border-white/20 hover:bg-white/10 text-white"
            onClick={() => {
              dismiss();
              undoDelete(recordId);
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Annuler
          </Button>
        ),
      });

      undoTimeouts.current[recordId] = setTimeout(() => {
        delete undoTimeouts.current[recordId];
      }, 10000);
      
      if (onRefresh) onRefresh();
    }
    return { success };
  };

  return { deleteRecord, undoDelete, isDeleting: isDeleting || isSoftDeleting };
};