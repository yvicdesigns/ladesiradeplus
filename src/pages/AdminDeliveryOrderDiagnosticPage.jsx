import React, { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, Play, Database, Activity, RefreshCw, Filter, FileCode } from 'lucide-react';
import {
  inspectOrdersTable,
  analyzeDeliveryOrdersTable,
  investigateSpecificOrder,
  analyzeRealtimeFilters,
  analyzeDeliveryQuery,
  traceStatusUpdate
} from '@/lib/DeliveryOrderDiagnosticInvestigation';
import { toast } from '@/components/ui/use-toast';

export default function AdminDeliveryOrderDiagnosticPage() {
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  
  const [results, setResults] = useState({
    dbInspection: null,
    deliveryTable: null,
    specificOrder: null,
    realtimeFilters: null,
    queryAnalysis: null,
    statusTrace: null
  });

  const runFullDiagnostic = async () => {
    setLoading(true);
    try {
      const dbRes = await inspectOrdersTable();
      const delRes = await analyzeDeliveryOrdersTable();
      const rtRes = analyzeRealtimeFilters();
      const qRes = await analyzeDeliveryQuery();

      setResults(prev => ({
        ...prev,
        dbInspection: dbRes.data,
        deliveryTable: delRes.data,
        realtimeFilters: rtRes.data,
        queryAnalysis: qRes.data
      }));
      toast({ title: "Diagnostic terminé", description: "Les données globales ont été analysées." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const runSpecificOrderDiagnostic = async () => {
    if (!orderId) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez entrer un ID de commande" });
      return;
    }
    setLoading(true);
    try {
      const specRes = await investigateSpecificOrder(orderId);
      const traceRes = await traceStatusUpdate(orderId);
      const qRes = await analyzeDeliveryQuery(orderId);

      setResults(prev => ({
        ...prev,
        specificOrder: specRes.data,
        statusTrace: traceRes.data,
        queryAnalysis: qRes.data // Update query analysis for specific order
      }));
      toast({ title: "Analyse spécifique terminée", description: `Commande ${orderId} analysée.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const JsonViewer = ({ data }) => (
    <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-slate-950">
      <pre className="text-xs text-green-400 font-mono">
        {JSON.stringify(data, null, 2)}
      </pre>
    </ScrollArea>
  );

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Investigation: Statut "Confirmé" Bloqué</h1>
            <p className="text-muted-foreground mt-1">
              Outils de diagnostic approfondi pour comprendre pourquoi les commandes livraison ne se mettent pas à jour côté client.
            </p>
          </div>
          <Button onClick={runFullDiagnostic} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Lancer Diagnostic Global
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Analyse Spécifique (Par Commande)</CardTitle>
            <CardDescription>Entrez l'ID d'une commande qui pose problème pour tracer son statut.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Input 
              placeholder="Ex: 550e8400-e29b-41d4-a716-446655440000" 
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="font-mono text-sm"
            />
            <Button onClick={runSpecificOrderDiagnostic} disabled={loading || !orderId} variant="secondary">
              <Search className="h-4 w-4 mr-2" /> Inspecter
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="db" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-4">
            <TabsTrigger value="db"><Database className="h-4 w-4 mr-2"/> Orders DB</TabsTrigger>
            <TabsTrigger value="delivery"><Database className="h-4 w-4 mr-2"/> Delivery DB</TabsTrigger>
            <TabsTrigger value="specific"><Search className="h-4 w-4 mr-2"/> Ordre Test</TabsTrigger>
            <TabsTrigger value="realtime"><Activity className="h-4 w-4 mr-2"/> Realtime</TabsTrigger>
            <TabsTrigger value="query"><Filter className="h-4 w-4 mr-2"/> Query</TabsTrigger>
            <TabsTrigger value="trace"><RefreshCw className="h-4 w-4 mr-2"/> Trace</TabsTrigger>
          </TabsList>

          <TabsContent value="db">
            <Card>
              <CardHeader>
                <CardTitle>Inspection Table 'orders'</CardTitle>
                <CardDescription>Valeurs réelles et décomptes dans la table principale</CardDescription>
              </CardHeader>
              <CardContent>
                {results.dbInspection ? <JsonViewer data={results.dbInspection} /> : <p className="text-sm text-muted-foreground">Cliquez sur "Lancer Diagnostic Global" pour analyser.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery">
            <Card>
              <CardHeader>
                <CardTitle>Inspection Table 'delivery_orders'</CardTitle>
                <CardDescription>Analyse des désynchronisations de statuts entre tables</CardDescription>
              </CardHeader>
              <CardContent>
                {results.deliveryTable ? <JsonViewer data={results.deliveryTable} /> : <p className="text-sm text-muted-foreground">Cliquez sur "Lancer Diagnostic Global" pour analyser.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specific">
            <Card>
              <CardHeader>
                <CardTitle>Données Complètes de la Commande</CardTitle>
                <CardDescription>Toutes les colonnes pour l'ID spécifié</CardDescription>
              </CardHeader>
              <CardContent>
                {results.specificOrder ? <JsonViewer data={results.specificOrder} /> : <p className="text-sm text-muted-foreground">Entrez un ID et cliquez sur "Inspecter" pour analyser.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="realtime">
            <Card>
              <CardHeader>
                <CardTitle>Analyse Filtre Realtime</CardTitle>
                <CardDescription>Comment le client écoute les changements</CardDescription>
              </CardHeader>
              <CardContent>
                {results.realtimeFilters ? (
                  <div className="bg-slate-100 p-4 rounded-md border text-sm whitespace-pre-wrap font-mono">
                    {results.realtimeFilters.explanation}
                  </div>
                ) : <p className="text-sm text-muted-foreground">Cliquez sur "Lancer Diagnostic Global" pour analyser.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="query">
            <Card>
              <CardHeader>
                <CardTitle>Analyse Query useDeliveryOrdersData</CardTitle>
                <CardDescription>La requête SQL exacte générée par le hook</CardDescription>
              </CardHeader>
              <CardContent>
                {results.queryAnalysis ? <JsonViewer data={results.queryAnalysis} /> : <p className="text-sm text-muted-foreground">Lancez une analyse pour voir la requête.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trace">
            <Card>
              <CardHeader>
                <CardTitle>Trace de Mise à Jour de Statut</CardTitle>
                <CardDescription>Simulation d'un changement de statut sur la commande spécifiée</CardDescription>
              </CardHeader>
              <CardContent>
                {results.statusTrace ? <JsonViewer data={results.statusTrace} /> : <p className="text-sm text-muted-foreground">Entrez un ID et cliquez sur "Inspecter" pour générer la trace.</p>}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </AdminLayout>
  );
}