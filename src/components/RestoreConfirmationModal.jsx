import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { restoreWithAudit } from '@/lib/softDeleteUtils';
import { Loader2, RotateCcw } from 'lucide-react';

export const RestoreConfirmationModal = ({ open, onClose, log, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!log) return null;

  const handleRestore = async () => {
    setLoading(true);
    const reason = `Restauration admin (Audit Log ID: ${log.id})`;
    const result = await restoreWithAudit(log.table_name, log.record_id, reason);
    setLoading(false);

    if (result.success) {
      toast({ 
        title: "Restauration réussie", 
        description: "L'enregistrement a été restauré avec succès.",
        className: "bg-green-600 text-white"
      });
      if (onSuccess) onSuccess();
      onClose();
    } else {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: result.error || "Impossible de restaurer l'enregistrement." 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            Confirmer la restauration
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir restaurer cet enregistrement ?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-lg space-y-2 text-sm mt-4">
          <div className="flex justify-between border-b pb-1">
            <span className="font-semibold text-muted-foreground">Table:</span>
            <span>{log.table_name}</span>
          </div>
          <div className="flex justify-between border-b pb-1">
            <span className="font-semibold text-muted-foreground">ID Record:</span>
            <span className="font-mono text-xs">{log.record_id}</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="font-semibold text-muted-foreground">Action d'origine:</span>
            <span>{log.action}</span>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleRestore} disabled={loading} className="bg-primary text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Restaurer l'enregistrement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};