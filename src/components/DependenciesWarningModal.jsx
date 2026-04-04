import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export const DependenciesWarningModal = ({ open, dependencies, onClose, onDeleteAnyway, onCascadeDelete }) => {
  const [countdown, setCountdown] = useState(5);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer;
    if (open && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    } else if (!open) {
      setCountdown(5);
      setIsDeleting(false);
    }
    return () => clearInterval(timer);
  }, [open, countdown]);

  const handleCascade = async () => {
    setIsDeleting(true);
    await onCascadeDelete();
    setIsDeleting(false);
  };

  const handleNormalDelete = async () => {
    setIsDeleting(true);
    await onDeleteAnyway();
    setIsDeleting(false);
  };

  if (!open || !dependencies) return null;

  const totalDeps = dependencies.reduce((sum, d) => sum + d.count, 0);

  return (
    <Dialog open={open} onOpenChange={(val) => !val && !isDeleting && onClose()}>
      <DialogContent className="max-w-xl border-red-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 text-xl">
            <AlertTriangle className="h-6 w-6" />
            Attention : Dépendances Détectées
          </DialogTitle>
          <DialogDescription className="text-gray-700 font-medium pt-2">
            Cet enregistrement est lié à <strong>{totalDeps} autres éléments actifs</strong>. Si vous continuez, vous risquez de créer des données orphelines.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-red-50/50 border border-red-100 rounded-lg p-0 mt-2 overflow-hidden">
          <div className="px-4 py-2 bg-red-100/50 border-b border-red-100 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-semibold text-red-800">Éléments impactés</span>
          </div>
          <ScrollArea className="max-h-[200px] p-4">
            <div className="space-y-3">
              {dependencies.map((dep, i) => (
                <div key={i} className="flex flex-col gap-1 pb-3 border-b last:border-0 last:pb-0">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-gray-800 capitalize">{dep.table.replace('_', ' ')}</span>
                    <Badge variant="destructive" className="bg-red-600">{dep.count} actifs</Badge>
                  </div>
                  <p className="text-xs text-gray-500 font-mono line-clamp-1">
                    IDs: {dep.ids.slice(0, 3).join(', ')} {dep.ids.length > 3 ? '...' : ''}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isDeleting} className="sm:mr-auto">
            Annuler
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleNormalDelete} 
            disabled={isDeleting}
            className="bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200"
            title="Conserve les éléments liés (peut causer des bugs d'affichage)"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Supprimer Seulement
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleCascade} 
            disabled={countdown > 0 || isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Cascade ({totalDeps} liés) {countdown > 0 ? `(${countdown}s)` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};