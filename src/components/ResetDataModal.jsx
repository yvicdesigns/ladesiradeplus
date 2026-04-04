import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, Loader2, XCircle, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export const ResetDataModal = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  loading, 
  diagnostics,
  progressData,
  isFinished,
  resultSummary
}) => {
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-amber-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'skipped': return <ChevronRight className="h-4 w-4 text-gray-400" />;
      default: return null;
    }
  };

  const getProgressValue = () => {
    if (!progressData || progressData.length === 0) return 0;
    const completed = progressData.filter(p => p.status === 'success' || p.status === 'error' || p.status === 'skipped').length;
    return Math.round((completed / progressData.length) * 100);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !loading && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-700 flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Purge de Production
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Elle supprimera définitivement les données transactionnelles tout en respectant l'intégrité des clés étrangères.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1 -mx-1">
          <div className="space-y-6 py-4">
            
            {/* 1. Diagnostics Phase */}
            {diagnostics && progressData.length === 0 && !isFinished && (
               <div className="space-y-4">
                  <h3 className="font-medium text-sm text-slate-800">Résultat de l'analyse système :</h3>
                  
                  <div className="bg-slate-50 p-4 rounded-lg border text-sm space-y-3">
                     <div className="flex items-center justify-between">
                        <span className="text-slate-600">Authentification:</span>
                        {diagnostics.authStatus === 'ok' ? <span className="text-amber-600 font-medium">Connecté</span> : <span className="text-red-600 font-medium">Échec</span>}
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-slate-600">Rôle Administrateur:</span>
                        {diagnostics.adminRole === 'ok' ? <span className="text-amber-600 font-medium">Validé</span> : <span className="text-red-600 font-medium">Refusé</span>}
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-slate-600">Connexion Base de données:</span>
                        {diagnostics.connection === 'ok' ? <span className="text-amber-600 font-medium">Stable</span> : <span className="text-red-600 font-medium">Instable</span>}
                     </div>
                  </div>

                  {diagnostics.preResetReport && !diagnostics.preResetReport.success && (
                      <div className="bg-amber-50 p-3 rounded border border-amber-200 text-amber-800 text-xs">
                          <p className="font-bold mb-1">Avertissements de structure :</p>
                          <ul className="list-disc pl-4">
                              {diagnostics.preResetReport.warnings.map((w, i) => <li key={i}>{w}</li>)}
                          </ul>
                          <p className="mt-2 font-medium">La séquence de suppression stricte sera utilisée pour éviter les blocages.</p>
                      </div>
                  )}

                  {!diagnostics.canProceed && (
                     <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-red-800 text-sm">
                        <p className="font-bold mb-2">Problèmes bloquants :</p>
                        <ul className="list-disc pl-5 space-y-1">
                           {diagnostics.errors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                     </div>
                  )}
               </div>
            )}

            {/* 2. Execution Phase */}
            {(progressData.length > 0 || loading) && (
               <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-sm font-medium">Séquence de Suppression (Enfants vers Parents)</span>
                     <span className="text-sm font-bold text-blue-600">{getProgressValue()}%</span>
                  </div>
                  <Progress value={getProgressValue()} className="h-2" />
                  
                  <div className="bg-slate-900 rounded-lg p-3 mt-4 h-[250px] overflow-y-auto font-mono text-xs">
                     {progressData.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 py-1 border-b border-slate-800 last:border-0">
                           <div className="mt-0.5">{getStatusIcon(item.status)}</div>
                           <div className="flex-1">
                              <div className="flex justify-between">
                                 <span className={item.status === 'error' ? 'text-red-400' : 'text-slate-300'}>
                                    [{item.table}]
                                 </span>
                                 {item.count > 0 && <span className="text-blue-400">{item.count} lignes</span>}
                              </div>
                              {item.message && <div className="text-slate-500 mt-0.5">{item.message}</div>}
                              {item.error && <div className="text-red-400 mt-0.5 whitespace-pre-wrap">{item.error}</div>}
                           </div>
                        </div>
                     ))}
                     {loading && progressData.length > 0 && (
                        <div className="flex items-center gap-2 py-2 text-slate-400 animate-pulse">
                           <Loader2 className="h-3 w-3 animate-spin" /> Traitement en cours...
                        </div>
                     )}
                  </div>
               </div>
            )}

          </div>
        </ScrollArea>

        <DialogFooter className="mt-4 pt-4 border-t gap-2 sm:gap-0">
          {!loading && !isFinished && (
             <Button variant="outline" onClick={() => onOpenChange(false)}>
               Annuler
             </Button>
          )}
          
          {diagnostics?.canProceed && !loading && !isFinished && (
             <Button variant="destructive" onClick={onConfirm}>
               Confirmer la Purge Définitive
             </Button>
          )}

          {isFinished && (
             <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
               Fermer le rapport
             </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};