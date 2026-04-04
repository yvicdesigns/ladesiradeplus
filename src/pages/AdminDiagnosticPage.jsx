import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateDiagnosticReport } from '@/lib/diagnosticReport';
import { clearAllAppCache } from '@/lib/cacheUtils';
import { verifyAndRestoreSession } from '@/lib/sessionPersistence';
import { 
  Activity, Server, Database, Wifi, Shield, 
  Trash2, RefreshCw, Download, Bug, Clock, CheckCircle, XCircle, AlertCircle 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AdminDiagnosticPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await generateDiagnosticReport();
      setReport(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de générer le rapport de diagnostic."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleClearCache = () => {
    const res = clearAllAppCache();
    toast({
      title: res.success ? "Cache vidé" : "Erreur",
      description: res.success ? `${res.count} éléments supprimés.` : res.error,
      variant: res.success ? "default" : "destructive"
    });
    fetchReport();
  };

  const handleTestConnection = async () => {
    setActionLoading(true);
    await fetchReport();
    setActionLoading(false);
    toast({ title: "Connexion testée", description: "Le rapport a été mis à jour." });
  };

  const handleRestoreSession = async () => {
    setActionLoading(true);
    const session = await verifyAndRestoreSession();
    setActionLoading(false);
    toast({
      title: session ? "Session valide" : "Session expirée/invalide",
      description: session ? "La session est active." : "Aucune session active n'a été trouvée.",
      variant: session ? "default" : "destructive"
    });
    fetchReport();
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ladesiradeplus_diagnostic_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && !report) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="flex flex-col items-center gap-4">
           <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
           <p className="text-gray-500">Génération du rapport en cours...</p>
        </div>
      </div>
    );
  }

  const isSupabaseOk = report?.supabase?.connectionTest?.success;
  const isNetworkOk = report?.network?.online;
  const isAuthOk = report?.supabase?.authStatus?.isAuthenticated;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-8 w-8 text-amber-500" /> Diagnostic Système
          </h1>
          <p className="text-gray-500 mt-1">Dernière vérification : {report ? new Date(report.timestamp).toLocaleString() : '-'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleTestConnection} disabled={actionLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${actionLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={handleDownload} className="bg-gray-900 hover:bg-gray-800 text-white">
            <Download className="h-4 w-4 mr-2" />
            Exporter JSON
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex justify-between items-center">
              Base de données <Database className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isSupabaseOk ? <CheckCircle className="h-5 w-5 text-amber-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
              <span className="text-xl font-bold">{isSupabaseOk ? "Connecté" : "Erreur"}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex justify-between items-center">
              Réseau Client <Wifi className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isNetworkOk ? <CheckCircle className="h-5 w-5 text-amber-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
              <span className="text-xl font-bold">{isNetworkOk ? "En ligne" : "Hors ligne"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex justify-between items-center">
              Authentification <Shield className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isAuthOk ? <CheckCircle className="h-5 w-5 text-amber-500" /> : <XCircle className="h-5 w-5 text-yellow-500" />}
              <span className="text-xl font-bold">{isAuthOk ? "Session Active" : "Non Authentifié"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex justify-between items-center">
              Cache Local <Server className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">{report?.cache?.localStorageKeys?.length || 0} entrées</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {!isSupabaseOk && report?.supabase?.connectionTest?.errors && (
         <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreurs de connexion détectées</AlertTitle>
            <AlertDescription>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                    {report.supabase.connectionTest.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
            </AlertDescription>
         </Alert>
      )}

      <Tabs defaultValue="actions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="actions">Actions & Outils</TabsTrigger>
          <TabsTrigger value="logs">Logs Récents</TabsTrigger>
          <TabsTrigger value="raw">Données Brutes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="actions" className="mt-4 space-y-4">
           <Card>
              <CardHeader>
                 <CardTitle>Utilitaires de réparation</CardTitle>
                 <CardDescription>Outils pour résoudre les problèmes courants du navigateur.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4">
                 <Button onClick={handleClearCache} variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-2" /> Vider le cache d'application
                 </Button>
                 <Button onClick={handleRestoreSession} variant="outline" className="flex-1">
                    <Shield className="h-4 w-4 mr-2" /> Forcer la vérification de session
                 </Button>
              </CardContent>
           </Card>
           
           <Card>
              <CardHeader>
                 <CardTitle>Recommandations</CardTitle>
              </CardHeader>
              <CardContent>
                 <ul className="space-y-2 text-sm text-gray-700">
                    {!isNetworkOk && <li>• <strong>Réseau :</strong> L'appareil semble hors ligne. Vérifiez la connexion Wi-Fi ou mobile.</li>}
                    {!isSupabaseOk && <li>• <strong>Base de données :</strong> La connexion à Supabase échoue. Si le réseau est OK, vérifiez que le projet Supabase n'est pas en veille.</li>}
                    {!report?.supabase?.config?.isValid && <li>• <strong>Configuration :</strong> Les variables d'environnement VITE_SUPABASE_URL ou KEY sont manquantes.</li>}
                    {(report?.cache?.localStorageKeys?.length > 30) && <li>• <strong>Cache :</strong> Le stockage local contient beaucoup de données. Envisagez de le vider si l'application est lente.</li>}
                    {isNetworkOk && isSupabaseOk && <li>• <strong>Statut :</strong> Tous les voyants sont au vert. Si un problème persiste, vérifiez les logs.</li>}
                 </ul>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
           <Card>
              <CardHeader>
                 <CardTitle className="flex items-center gap-2"><Bug className="h-5 w-5" /> Console de l'application</CardTitle>
              </CardHeader>
              <CardContent>
                 <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-gray-950">
                    {report?.recentLogs && report.recentLogs.length > 0 ? (
                        <div className="space-y-2">
                           {report.recentLogs.slice().reverse().map((log, i) => (
                               <div key={i} className="text-xs font-mono">
                                  <span className="text-gray-500 mr-2">[{new Date(log.time).toLocaleTimeString()}]</span>
                                  <span className={`font-bold mr-2 ${
                                      log.level === 'ERROR' ? 'text-red-400' : 
                                      log.level === 'WARN' ? 'text-yellow-400' : 
                                      log.level === 'DEBUG' ? 'text-purple-400' : 'text-blue-400'
                                  }`}>[{log.level}]</span>
                                  <span className={log.level === 'ERROR' ? 'text-red-300' : 'text-gray-300'}>{log.message}</span>
                               </div>
                           ))}
                        </div>
                    ) : (
                        <div className="text-gray-500 text-center mt-10">Aucun log enregistré</div>
                    )}
                 </ScrollArea>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="raw" className="mt-4">
           <Card>
              <CardContent className="pt-6">
                 <ScrollArea className="h-[500px] w-full rounded-md border p-4 bg-gray-50">
                    <pre className="text-xs text-gray-800 font-mono">
                       {JSON.stringify(report, null, 2)}
                    </pre>
                 </ScrollArea>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDiagnosticPage;