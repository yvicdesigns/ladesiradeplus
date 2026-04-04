import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, RefreshCw } from "lucide-react";

export const ConfirmationRestoreMultipleModal = ({ 
  open, 
  onClose, 
  selectedCount, 
  onConfirm, 
  loading = false 
}) => {
  if (!open) return null;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md border-amber-200 bg-amber-50/50">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <RefreshCw className="h-6 w-6" />
            <AlertDialogTitle className="text-xl">Restaurer la sélection ?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-gray-700">
            Êtes-vous sûr de vouloir restaurer <strong>{selectedCount}</strong> commandes ? Elles réapparaîtront dans la liste principale.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={loading} className="bg-white hover:bg-gray-100 border-gray-200">
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white border-none shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Restauration...
              </>
            ) : (
              "Restaurer"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};