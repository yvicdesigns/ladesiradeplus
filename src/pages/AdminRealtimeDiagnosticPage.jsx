import React, { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Activity, Wrench, TerminalSquare, Play } from 'lucide-react';

export default function AdminRealtimeDiagnosticPage() {
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [testStatus, setTestStatus] = useState('idle'); // idle, testing, success, error
  const [testLogs, setTestLogs] = useState([]);
  const channelRef = useRef(null);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('diagnose_realtime_configuration');
      if (error) throw error;
      setDiagnosticData(data);
    } catch (err) {
      console.error('Diagnostic error:', err);
      toast({
        variant: "destructive",
        title: "Erreur de diagnostic",
        description: err.message || "Impossible de charger la configuration Realtime."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const addLog = (msg) => {
    setTestLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const fixConfiguration = async () => {
    setFixing(true);
    try {
      const { data, error } = await supabase.rpc('enable_realtime_for_table', { p_table_name: 'orders' });
      if (error) throw error;
      
      toast({
        title: data.success ? "Succès" : "Attention",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
      
      await runDiagnostics();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur de correction",
        description: err.message
      });
    } finally {
      setFixing(false);
    }
  };

  const testRealtimeConnection = async () => {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
    }

    setTestStatus('testing');
    setTestLogs([]);
    addLog('Initialisation du test de souscription Realtime...');

    const channelName = `realtime-test-${Date.now()}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        addLog(`Événement reçu ! Type: ${payload.eventType}`);
        addLog(`ID de la commande: ${payload.new?.id || payload.old?.id}`);
        setTestStatus('success');
      }
    );

    channel.subscribe(async (status, err) => {
      addLog(`Statut de souscription: ${status}`);
      if (status === 'SUBSCRIBED') {
        addLog('Souscrit avec succès. Déclenchement d\'une mise à jour de test...');
        
        try {
          // Trigger a safe update to test the realtime feed (just touch updated_at of latest order)
          const { data: latestOrder } = await supabase.from('orders').select('id').limit(1).single();
          
          if (latestOrder) {
            const { error } = await supabase
              .from('orders')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', latestOrder.id);
              
            if (error) throw error;
            addLog(`Mise à jour de la commande ${latestOrder.id.substring(0,8)}... en attente de l'événement.`);
            
            // Set a timeout in case realtime fails
            setTimeout(() => {
              setTestStatus(current => {
                if (current === 'testing') {
                  addLog('Délai dépassé. Aucun événement reçu après 10 secondes.');
                  return 'error';
                }
                return current;
              });
            }, 10000);
            
          } else {
            addLog('Aucune commande trouvée pour déclencher le test. Créez une commande d\'abord.');
            setTestStatus('error');
          }
        } catch (updateErr) {
          addLog(`Erreur de déclenchement: ${updateErr.message}`);
          setTestStatus('error');
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
        addLog(`Erreur de canal: ${err?.message || 'Déconnecté'}`);
        setTestStatus('error');
      }
    });
  };

  const StatusIcon = ({ isGood }) => 
    isGood ? <CheckCircle2 className="w-5 h-5 text-amber-500" /> : <XCircle className="w-5 h-5 text-red-500" />;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <Activity className="w-8 h-8 text-blue-600" />
              Diagnostic Realtime
            </h1>
            <p className="text-gray-500 mt-1">
              Vérifiez et réparez la configuration de Supabase Realtime pour la table des commandes.
            </p>
          </div>
          <Button onClick={runDiagnostics} disabled={loading} variant="outline" className="bg-white">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser le diagnostic
          </Button>
        </div>

        {diagnosticData && diagnosticData.status !== 'OK' && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-lg font-bold">Configuration Incomplète</AlertTitle>
            <AlertDescription className="mt-2 text-sm flex flex-col gap-3">
              <span>La table des commandes n'est pas correctement configurée pour les mises à jour en temps réel. Cela empêchera le tableau de bord de se mettre à jour automatiquement lors de nouvelles commandes.</span>
              <Button onClick={fixConfiguration} disabled={fixing} className="w-fit bg-red-600 hover:bg-red-700 text-white">
                <Wrench className={`w-4 h-4 mr-2 ${fixing ? 'animate-spin' : ''}`} />
                Réparer la configuration
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {diagnosticData && diagnosticData.status === 'OK' && (
          <Alert className="bg-amber-50 border-amber-200 text-amber-800">
            <CheckCircle2 className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-lg font-bold">Configuration Optimale</AlertTitle>
            <AlertDescription className="mt-1">
              La table <strong>orders</strong> est correctement configurée avec l'identité de réplicat FULL et est incluse dans la publication realtime.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                État de la Configuration (orders)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {loading ? (
                <div className="flex justify-center py-8"><RefreshCw className="w-8 h-8 animate-spin text-gray-300" /></div>
              ) : diagnosticData ? (
                <ul className="space-y-4">
                  <li className="flex justify-between items-center p-3 bg-white border rounded-lg">
                    <span className="font-medium text-gray-700">Publication <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">supabase_realtime</code></span>
                    <div className="flex items-center gap-2">
                      {diagnosticData.publication_exists ? <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Existe</Badge> : <Badge variant="destructive">Manquante</Badge>}
                      <StatusIcon isGood={diagnosticData.publication_exists} />
                    </div>
                  </li>
                  <li className="flex justify-between items-center p-3 bg-white border rounded-lg">
                    <span className="font-medium text-gray-700">Table <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">orders</code> dans la publication</span>
                    <div className="flex items-center gap-2">
                      {diagnosticData.orders_in_publication ? <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Incluse</Badge> : <Badge variant="destructive">Absente</Badge>}
                      <StatusIcon isGood={diagnosticData.orders_in_publication} />
                    </div>
                  </li>
                  <li className="flex justify-between items-center p-3 bg-white border rounded-lg">
                    <span className="font-medium text-gray-700">Replica Identity</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={diagnosticData.orders_replica_identity === 'FULL' ? "border-green-500 text-amber-700" : "border-red-500 text-red-700"}>
                        {diagnosticData.orders_replica_identity}
                      </Badge>
                      <StatusIcon isGood={diagnosticData.orders_replica_identity === 'FULL'} />
                    </div>
                  </li>
                  <li className="flex justify-between items-center p-3 bg-white border rounded-lg">
                    <span className="font-medium text-gray-700">Row Level Security (RLS)</span>
                    <div className="flex items-center gap-2">
                      {diagnosticData.orders_rls_enabled ? <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Activé</Badge> : <Badge variant="destructive">Désactivé</Badge>}
                      <StatusIcon isGood={diagnosticData.orders_rls_enabled} />
                    </div>
                  </li>
                </ul>
              ) : (
                <div className="text-center text-gray-500 py-4">Aucune donnée</div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200 flex flex-col">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2"><TerminalSquare className="w-5 h-5" /> Test de Souscription</span>
                <Button size="sm" onClick={testRealtimeConnection} disabled={testStatus === 'testing' || loading} className="bg-indigo-600 hover:bg-indigo-700">
                  <Play className="w-4 h-4 mr-1" /> Tester
                </Button>
              </CardTitle>
              <CardDescription>Vérifie si les événements arrivent jusqu'au navigateur.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 flex-1 p-0">
              <div className="bg-slate-900 text-green-400 font-mono text-sm p-4 h-[300px] overflow-hidden flex flex-col rounded-b-xl relative">
                {testLogs.length === 0 ? (
                  <div className="text-slate-500 italic text-center my-auto">
                    Appuyez sur "Tester" pour lancer une vérification de la connexion websocket.
                  </div>
                ) : (
                  <ScrollArea className="flex-1 pr-4">
                    {testLogs.map((log, i) => (
                      <div key={i} className="mb-1 leading-relaxed">
                        {log.includes('Erreur') || log.includes('Délai') ? (
                          <span className="text-red-400">{log}</span>
                        ) : log.includes('Succès') || log.includes('Événement reçu') ? (
                          <span className="text-green-300 font-bold">{log}</span>
                        ) : (
                          <span>{log}</span>
                        )}
                      </div>
                    ))}
                  </ScrollArea>
                )}
                
                {testStatus === 'testing' && (
                  <div className="absolute top-2 right-4 flex items-center gap-2 bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                    <span className="text-xs text-slate-300">En écoute...</span>
                  </div>
                )}
                {testStatus === 'success' && (
                  <div className="absolute top-2 right-4 flex items-center gap-2 bg-green-900/40 px-2 py-1 rounded border border-green-800">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-green-400">Test réussi</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {diagnosticData && diagnosticData.tables_in_publication && (
          <Card className="shadow-sm border-gray-200 mt-6">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-lg text-gray-700">Toutes les tables dans supabase_realtime</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {diagnosticData.tables_in_publication.length > 0 ? (
                  diagnosticData.tables_in_publication.map(table => (
                    <Badge key={table} variant="secondary" className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200">
                      {table}
                    </Badge>
                  ))
                ) : (
                  <p className="text-gray-500 italic">Aucune table dans la publication.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}