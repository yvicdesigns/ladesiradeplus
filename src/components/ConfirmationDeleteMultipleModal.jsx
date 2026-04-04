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
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

export function ConfirmationDeleteMultipleModal({ 
  open, 
  onClose, 
  onConfirm, 
  selectedCount, 
  loading,
  isPermanent = false 
}) {
  const handleConfirm = async (e) => {
    e.preventDefault();
    console.log("🔴 [3] Multiple Delete Confirm button clicked. Count:", selectedCount);
    try {
      // Await the parent's onConfirm function in case it returns a Promise
      await onConfirm();
      console.log("🔴 [7] ConfirmationDeleteMultipleModal onConfirm executed successfully.");
    } catch (error) {
      console.error("🔴 [EXCEPTION] ConfirmationDeleteMultipleModal Error during onConfirm execution:", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">Confirmer la suppression multiple</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Vous êtes sur le point de supprimer <strong>{selectedCount}</strong> élément(s).
            </span>
            {isPermanent && (
              <span className="block font-medium text-red-600">
                Cette action est irréversible et effacera définitivement ces données de la base.
              </span>
            )}
            {!isPermanent && (
               <span className="block text-sm text-gray-500">
                 Ces éléments seront déplacés vers la corbeille.
               </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              'Supprimer définitivement'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}