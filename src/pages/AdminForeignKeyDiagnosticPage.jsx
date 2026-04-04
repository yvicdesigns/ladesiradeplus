import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle, Database, Zap, RefreshCw } from 'lucide-react';
import { verifyAdminSettingsIntegrity } from '@/lib/verifyAdminSettingsIntegrity';
import { fixAdminSettingsForeignKey } from '@/lib/fixAdminSettingsForeignKey';
import { useToast } from '@/hooks/use-toast';

export const AdminForeignKeyDiagnosticPage = () => {
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [report, setReport] = useState(null);
  const [fixResults, setFixResults] = useState(null);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const result = await verifyAdminSettingsIntegrity();
      if (result.success) {
        setReport(result.report);
      } else {
        toast({ variant: 'destructive', title: 'Erreur', description: result.error });
      }
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Erreur critique', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const handleFixIssues = async () => {
    setFixing(true);
    setFixResults(null);
    try {
      const result = await fixAdminSettingsForeignKey();
      setFixResults(result);
      
      if (result.success) {
        toast({ title: 'Correction Réussie', description: result.message });
        await runDiagnostics(); // Refresh state
      } else {
        toast({ variant: 'destructive', title: 'Échec', description: result.error || 'Erreur inconnue' });
      }
    } catch (err) {
       toast({ variant: 'destructive', title: 'Erreur', description: err.message });
    } finally {
      setFixing(false);
    }
  };

  return (
    <AdminLayout>
      <Helmet><title>Diagnostic Clés Étrangères - Admin</title></Helmet>
      
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Database className="h-8 w-8 text-indigo-600" />
            Diagnostic d'Intégrité FK (admin_settings)
          </h1>
          <p className="text-muted-foreground mt-1">
            Vérifiez et résolvez les violations de contraintes de clés étrangères entre admin_settings et restaurants.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : report ? (
          <>
            <Card className={report.isHealthy ? 'border-amber-200' : 'border-red-200'}>
              <CardHeader className={report.isHealthy ? 'bg-amber-50/50' : 'bg-red-50/50'}>
                <CardTitle className="flex items-center justify-between">
                  <span>État Actuel de la Base de Données</span>
                  {report.isHealthy ? (
                    <Badge className="bg-green-600"><CheckCircle className="w-4 h-4 mr-1"/> Sain</Badge>
                  ) : (
                    <Badge variant="destructive"><AlertTriangle className="w-4 h-4 mr-1"/> Problèmes Détectés</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {report.isHealthy 
                    ? "Aucune violation de clé étrangère n'a été détectée. Vos données sont intègres."
                    : "Des problèmes d'intégrité référentielle empêchent le bon fonctionnement de l'application."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {!report.isHealthy && report.issues.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <h3 className="font-semibold text-red-800">Problèmes Identifiés :</h3>
                    <ul className="list-disc pl-5 space-y-1 text-red-700">
                      {report.issues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 bg-slate-50">
                    <h4 className="font-semibold mb-2">Table Restaurants</h4>
                    <p className="text-sm">Enregistrements : <span className="font-mono font-bold">{report.diagnosticData?.restaurants_count}</span></p>
                    <p className="text-sm mt-1">Existe : {report.diagnosticData?.restaurants_table_exists ? 'Oui' : 'Non'}</p>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-slate-50">
                    <h4 className="font-semibold mb-2">Table Admin Settings</h4>
                    <p className="text-sm">Enregistrements : <span className="font-mono font-bold">{report.diagnosticData?.admin_settings_count}</span></p>
                    <p className="text-sm mt-1">Contrainte FK : {report.diagnosticData?.fk_constraint_status === 'exists' ? 'Active' : 'Manquante'}</p>
                  </div>
                </div>

                {!report.isHealthy && (
                  <div className="mt-8 flex flex-col items-center p-6 bg-amber-50 rounded-lg border border-amber-200">
                    <Zap className="h-10 w-10 text-amber-500 mb-3" />
                    <h3 className="text-lg font-bold text-amber-800 mb-2">Solution Recommandée</h3>
                    <p className="text-amber-700 text-center max-w-lg mb-4">
                      {report.diagnosticData?.recommendation}
                    </p>
                    <Button onClick={handleFixIssues} disabled={fixing} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                      {fixing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Appliquer la réparation automatique
                    </Button>
                  </div>
                )}
                
                {report.isHealthy && (
                   <div className="mt-6 flex justify-end">
                     <Button variant="outline" onClick={runDiagnostics} className="gap-2">
                       <RefreshCw className="w-4 h-4" /> Revérifier
                     </Button>
                   </div>
                )}
              </CardContent>
            </Card>

            {fixResults && (
              <Card>
                <CardHeader>
                  <CardTitle>Rapport d'Intervention</CardTitle>
                </CardHeader>
                <CardContent>
                  {fixResults.actionsTaken?.length > 0 ? (
                    <ul className="space-y-2">
                      {fixResults.actionsTaken.map((action, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle className="w-4 h-4 text-amber-500" /> {action}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground italic">Aucune action modifiant les données n'a été nécessaire.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Impossible de charger le diagnostic</AlertTitle>
            <AlertDescription>Une erreur inattendue s'est produite lors de l'appel RPC.</AlertDescription>
          </Alert>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminForeignKeyDiagnosticPage;