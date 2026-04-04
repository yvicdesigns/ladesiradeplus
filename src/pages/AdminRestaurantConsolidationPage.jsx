import React, { useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Database, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useRestaurantConsolidation } from '@/hooks/useRestaurantConsolidation';
import { AdminRestaurantConsolidationVerification } from '@/components/AdminRestaurantConsolidationVerification';

export default function AdminRestaurantConsolidationPage() {
  const { 
    loading, 
    verifying, 
    logs, 
    verificationData, 
    executeConsolidation, 
    verifyData,
    OLD_ID,
    NEW_ID
  } = useRestaurantConsolidation();

  useEffect(() => {
    verifyData();
  }, [verifyData]);

  const needsConsolidation = verificationData?.verification?.some(v => !v.clean) || verificationData?.old_restaurant_exists;

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-8 w-8 text-primary" /> Consolidation des Restaurants
          </h1>
          <p className="text-muted-foreground mt-1">
            Migration de l'ancien restaurant ID vers le nouvel ID unique et suppression des doublons.
          </p>
        </div>

        <Alert className="bg-amber-50 border-amber-200 text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="font-bold text-amber-800">Opération Critique Base de Données</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>Cette opération va parcourir <strong>toutes les tables</strong> de la base de données et remplacer l'ancien identifiant par le nouveau. Une fois la migration terminée, l'ancienne entrée du restaurant sera définitivement supprimée.</p>
            <div className="flex flex-col md:flex-row gap-2 md:items-center text-sm font-mono bg-white/50 p-2 rounded border border-amber-100">
              <span className="text-red-600 break-all truncate">{OLD_ID}</span>
              <ArrowRight className="w-4 h-4 hidden md:block flex-shrink-0 text-amber-400" />
              <span className="text-amber-600 break-all truncate">{NEW_ID}</span>
            </div>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Exécuter la Consolidation</CardTitle>
            <CardDescription>
              {needsConsolidation 
                ? "Des enregistrements liés à l'ancien ID ont été détectés. La consolidation est recommandée." 
                : "La base de données semble déjà consolidée. Aucune action n'est requise."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {logs && (
               <div className="bg-slate-950 rounded-md p-4 overflow-hidden border border-slate-800">
                 <h4 className="text-slate-300 text-sm font-semibold mb-2 flex items-center gap-2">
                   <CheckCircle2 className="w-4 h-4 text-green-400"/> Logs d'exécution
                 </h4>
                 <div className="space-y-1 max-h-60 overflow-y-auto font-mono text-xs text-slate-400">
                   {logs.map((log, i) => (
                     <div key={i} className="flex justify-between border-b border-slate-800 pb-1">
                       <span>{log.table}</span>
                       <span className={log.updated_count > 0 ? "text-green-400 font-bold" : "text-slate-500"}>
                         {log.updated_count} maj
                       </span>
                     </div>
                   ))}
                 </div>
               </div>
             )}
          </CardContent>
          <CardFooter className="bg-slate-50 border-t flex justify-end gap-4 rounded-b-xl py-4">
            <Button 
              variant="default" 
              className="bg-primary hover:bg-primary/90"
              onClick={executeConsolidation}
              disabled={loading || !needsConsolidation}
            >
              {loading ? "Consolidation en cours..." : "Lancer la Consolidation SQL"}
            </Button>
          </CardFooter>
        </Card>

        <AdminRestaurantConsolidationVerification 
          verificationData={verificationData}
          verifying={verifying}
          onVerify={verifyData}
        />
      </div>
    </AdminLayout>
  );
}