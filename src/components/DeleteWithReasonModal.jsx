import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Loader2 } from 'lucide-react';

export const DeleteWithReasonModal = ({ open, onClose, onConfirm, title, message, loading, requireReason = false }) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {title || 'Confirmation de suppression'}
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm text-muted-foreground">
            {message || 'Êtes-vous sûr de vouloir supprimer cet élément ?'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <label className="text-sm font-medium mb-2 block text-foreground">
            Raison de la suppression {requireReason ? '*' : '(Optionnel)'}
          </label>
          <Textarea 
            placeholder="Veuillez indiquer la raison de cette suppression pour l'historique d'audit..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px] resize-none"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Annuler
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={loading || (requireReason && !reason.trim())}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};