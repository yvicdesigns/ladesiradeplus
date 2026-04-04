import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/formatters';

export const AuditLogDetailModal = ({ open, onClose, log, onRestoreRequest }) => {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Détails du log d'audit</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Détails de l'action</TabsTrigger>
            <TabsTrigger value="data">Données Sauvegardées</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">Utilisateur</span>
                <p className="text-sm font-medium">{log.user_email || 'Système / Inconnu'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">Action</span>
                <div>
                  <Badge variant={log.action === 'DELETE' ? 'destructive' : log.action === 'RESTORE' ? 'default' : 'secondary'}>
                    {log.action}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">Table affectée</span>
                <p className="text-sm font-medium">{log.table_name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">ID de l'enregistrement</span>
                <p className="text-sm font-mono bg-muted p-1 rounded inline-block">{log.record_id || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">Date et heure</span>
                <p className="text-sm font-medium">{formatDateTime(log.created_at)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">Adresse IP</span>
                <p className="text-sm font-medium">{log.ip_address || 'Non enregistrée'}</p>
              </div>
              <div className="col-span-1 md:col-span-2 space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">Raison / Motif</span>
                <p className="text-sm bg-muted p-3 rounded-md">{log.reason || 'Aucun motif fourni'}</p>
              </div>
              <div className="col-span-1 md:col-span-2 space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">User Agent</span>
                <p className="text-xs text-muted-foreground break-all">{log.user_agent || 'Inconnu'}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data" className="flex-1 overflow-hidden p-0 m-0 mt-4 border rounded-md">
            <div className="h-full overflow-auto bg-slate-950 p-4">
              <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
                {/* CORRECTION: Affichage explicite de old_data */}
                {log.old_data ? JSON.stringify(log.old_data, null, 2) : '/* Aucune donnée sauvegardée dans old_data */'}
              </pre>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 border-t pt-4">
          <div className="flex justify-between w-full">
            {log.action === 'DELETE' && log.record_id ? (
              <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => onRestoreRequest(log)}>
                Restaurer cet enregistrement
              </Button>
            ) : (
              <div></div>
            )}
            <Button onClick={onClose}>Fermer</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};