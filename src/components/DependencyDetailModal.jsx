import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Layers, Loader2, AlertTriangle } from 'lucide-react';

export const DependencyDetailModal = ({ open, onClose, record, onCascadeDelete }) => {
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

  const handleDelete = async () => {
    setIsDeleting(true);
    await onCascadeDelete(record);
    setIsDeleting(false);
    onClose();
  };

  if (!open || !record) return null;

  const dependencies = record.dependencies || [];
  const totalDeps = dependencies.reduce((sum, d) => sum + d.count, 0);

  return (
    <Dialog open={open} onOpenChange={(val) => !val && !isDeleting && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Analyse des dépendances
          </DialogTitle>
          <DialogDescription>
            Enregistrement: <strong>{record.table_name}</strong> ({record.id})
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-4 px-4 py-2 mt-2">
          {dependencies.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucune dépendance active trouvée.</p>
          ) : (
            <div className="space-y-6">
              {dependencies.map((dep, idx) => (
                <div key={idx} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 border-b flex justify-between items-center">
                    <h4 className="font-bold text-sm capitalize">{dep.table.replace('_', ' ')}</h4>
                    <Badge variant="secondary">{dep.count} liés</Badge>
                  </div>
                  <div className="p-4 bg-card">
                    <p className="text-xs text-muted-foreground mb-2">IDs des enregistrements liés (Aperçu) :</p>
                    <div className="flex flex-wrap gap-2">
                      {dep.ids.slice(0, 10).map((id, i) => (
                        <code key={i} className="text-[10px] bg-secondary/50 px-2 py-1 rounded text-foreground border">
                          {id.split('-')[0]}...
                        </code>
                      ))}
                      {dep.ids.length > 10 && (
                        <span className="text-xs text-muted-foreground self-center">+{dep.ids.length - 10} autres</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="mt-4 pt-4 border-t gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isDeleting} className="sm:mr-auto">
            Fermer
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={countdown > 0 || isDeleting || totalDeps === 0}
            className="gap-2"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            Supprimer en cascade {countdown > 0 ? `(${countdown}s)` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};