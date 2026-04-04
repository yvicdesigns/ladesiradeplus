import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Activity, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const ConfirmationDeleteModal = ({ open, onClose, onConfirm, item, type = "l'élément", loading = false }) => {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const { role } = useAuth();

  const handleConfirmClick = (e) => {
    e.stopPropagation();
    console.log('🔴 [3] User confirmed deletion in modal for ID:', item?.id);
    if (onConfirm) {
      onConfirm();
    } else {
      console.error('🔴 [ERROR] onConfirm is not defined in ConfirmationDeleteModal!');
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmer la suppression
          </DialogTitle>
          <DialogDescription className="text-gray-600 pt-2">
            Êtes-vous sûr de vouloir supprimer {type} ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
           {item.id && (
             <div className="bg-gray-50 p-3 rounded-md text-xs font-mono border text-gray-600 flex justify-between items-center">
               <span>ID: {item.id}</span>
               <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-600" onClick={() => setShowDiagnostics(!showDiagnostics)}>
                 <Activity className="h-3 w-3 mr-1" /> {showDiagnostics ? "Masquer Détails" : "Détails Techniques"}
               </Button>
             </div>
           )}

           {showDiagnostics && (
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-md text-xs text-blue-800 space-y-2 animate-in fade-in slide-in-from-top-2">
                <p><strong>Rôle Actuel :</strong> {role}</p>
                <p><strong>Politiques RLS :</strong> La suppression nécessite les droits `DELETE` sur la table correspondante.</p>
                <p><strong>Requête Planifiée :</strong> <br/> <code className="bg-white px-1 border rounded block mt-1">DELETE FROM [table] WHERE id = '{item.id}';</code></p>
                {role !== 'admin' && (
                  <p className="text-amber-600 flex items-center mt-2"><AlertTriangle className="h-3 w-3 mr-1"/> Attention : Votre rôle pourrait ne pas avoir les permissions nécessaires.</p>
                )}
              </div>
           )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleConfirmClick} disabled={loading}>
            {loading ? "Suppression en cours..." : "Oui, supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};