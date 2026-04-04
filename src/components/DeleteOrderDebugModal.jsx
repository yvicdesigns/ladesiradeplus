import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Copy, RefreshCw, ServerCrash, ShieldAlert, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const DeleteOrderDebugModal = ({ open, onClose, errorData, orderId, onRetry }) => {
  if (!errorData) return null;

  const handleCopy = () => {
    const debugText = `Order ID: ${orderId}\nError Type: ${errorData.type}\nMessage: ${errorData.message}\nDetails: ${errorData.details}\nJSON: ${JSON.stringify(errorData.originalError, null, 2)}`;
    navigator.clipboard.writeText(debugText);
  };

  const getIcon = () => {
    switch (errorData.type) {
      case 'fk_constraint': return <ServerCrash className="h-6 w-6 text-red-500" />;
      case 'rls_policy': return <ShieldAlert className="h-6 w-6 text-amber-500" />;
      case 'network': return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      default: return <AlertCircle className="h-6 w-6 text-red-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            Échec de la Suppression
          </DialogTitle>
          <DialogDescription>
            La suppression de la commande a échoué. Voici les détails de diagnostic.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <Alert variant={errorData.type === 'rls_policy' ? 'default' : 'destructive'} className={errorData.type === 'rls_policy' ? 'border-amber-200 bg-amber-50 text-amber-800' : ''}>
            <AlertTitle className="font-bold">{errorData.title}</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-2">{errorData.message}</p>
              <p className="font-semibold">Suggestion :</p>
              <p className="text-sm">{errorData.suggestion}</p>
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-4 rounded-lg border text-sm font-mono text-gray-700 overflow-x-auto">
             <p><span className="font-bold text-gray-900">ID Commande :</span> {orderId}</p>
             <p className="mt-2"><span className="font-bold text-gray-900">Requête échouée / Cible :</span> DELETE FROM orders WHERE id = '{orderId}'</p>
             <p className="mt-2"><span className="font-bold text-gray-900">Erreur Brute Supabase :</span></p>
             <pre className="mt-1 p-2 bg-gray-800 text-green-400 rounded-md text-xs whitespace-pre-wrap">
               {JSON.stringify(errorData.originalError, null, 2)}
             </pre>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between items-center gap-2 mt-4">
          <Button variant="outline" onClick={handleCopy} className="flex items-center gap-2">
            <Copy className="h-4 w-4" /> Copier les Logs
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Fermer</Button>
            {onRetry && (
               <Button onClick={onRetry} className="flex items-center gap-2">
                 <RefreshCw className="h-4 w-4" /> Réessayer
               </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};