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
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const DeleteAllConfirmationModal = ({ 
  open, 
  onClose, 
  count, 
  onConfirm, 
  loading = false,
  filtersApplied = false
}) => {
  if (!open) return null;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md border-red-200 bg-red-50/90 backdrop-blur-sm">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="h-6 w-6" />
            <AlertDialogTitle className="text-xl font-bold">ATTENTION : Suppression massive</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-gray-800 space-y-3">
            <p>
              Vous êtes sur le point de supprimer <span className="font-bold text-red-600 text-lg">{count}</span> commandes.
            </p>
            
            {filtersApplied ? (
               <div className="bg-white/50 p-2 rounded-md border border-red-100 text-sm">
                 <p className="font-semibold text-red-800 mb-1">Filtres appliqués :</p>
                 <p>Seules les commandes correspondant à vos filtres actuels seront supprimées.</p>
               </div>
            ) : (
               <div className="bg-red-100 p-3 rounded-md border border-red-200 text-sm font-medium text-red-900">
                 ⚠️ Aucun filtre appliqué. Cette action supprimera TOUT l'historique visible.
               </div>
            )}
            
            <p className="text-xs text-gray-500 mt-2">
              Ces commandes seront déplacées vers la corbeille (suppression logicielle) et pourront être restaurées ultérieurement si nécessaire.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={loading} className="bg-white hover:bg-gray-100 border-gray-200 text-gray-900">
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white border-none shadow-sm font-bold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression en cours...
              </>
            ) : (
              <span className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Tout Supprimer ({count})
              </span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};