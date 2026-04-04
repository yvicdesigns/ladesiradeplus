import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { saveAs } from 'file-saver';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlayCircle, Download, Trash2, CheckCircle2, XCircle, Clock, Loader2, FileText, Database, ListChecks, ShieldAlert, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Hooks & Components
import { useTestTransactions } from '@/hooks/useTestTransactions';
import { useTestOrderHistory } from '@/hooks/useTestOrderHistory';
import { useTestUUID } from '@/hooks/useTestUUID';
import { useTestRealScenarios } from '@/hooks/useTestRealScenarios';
import { useTestErrorHandling } from '@/hooks/useTestErrorHandling';
import { TestResultsSummary } from '@/components/TestResultsSummary';

export const AdminTestCorrectionsPage = () => {
  const { toast } = useToast();
  
  const testTransactions = useTestTransactions();
  const testOrderHistory = useTestOrderHistory();
  const testUUID = useTestUUID();
  const testScenarios = useTestRealScenarios();
  const testErrors = useTestErrorHandling();

  const [allResults, setAllResults] = useState({
    transactions: null,
    history: null,
    uuid: null,
    scenarios: null,
    errorHandling: null
  });

  const [isTestingAll, setIsTestingAll] = useState(false);

  // Sync individual results to aggregate state
  useEffect(() => {
    setAllResults({
      transactions: testTransactions.results,
      history: testOrderHistory.results,
      uuid: testUUID.results,
      scenarios: testScenarios.results,
      errorHandling: testErrors.results
    });
  }, [
    testTransactions.results, 
    testOrderHistory.results, 
    testUUID.results, 
    testScenarios.results, 
    testErrors.results
  ]);

  const runAllTests = async () => {
    setIsTestingAll(true);
    toast({ title: "Exécution des tests", description: "Lancement de tous les scénarios de test..." });
    
    await testTransactions.runTest();
    await testOrderHistory.runTest();
    await testUUID.runTest();
    await testScenarios.runTest();
    await testErrors.runTest();
    
    setIsTestingAll(false);
    toast({ title: "Tests terminés", description: "Tous les tests ont été exécutés.", className: "bg-amber-500 text-white" });
  };

  const resetResults = () => {
    setAllResults({ transactions: null, history: null, uuid: null, scenarios: null, errorHandling: null });
    // Note: React state resetting for individual hooks might be necessary if we wanted to fully clear them, 
    // but just clearing the aggregate allows the summary to blank out. We could also force re-mount hooks, 
    // but just reloading page is easier for a full hard reset.
    window.location.reload();
  };

  const exportJSON = () => {
    const data = JSON.stringify({ timestamp: new Date().toISOString(), results: allResults }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    saveAs(blob, `audit_corrections_${new Date().toISOString().split('T')[0]}.json`);
    toast({ title: "Export réussi", description: "Rapport JSON téléchargé." });
  };

  const exportCSV = () => {
    const rows = [
      ["Test Category", "Success", "Execution Time (ms)", "Errors"],
      ["Transactions Atomiques", allResults.transactions?.success || "N/A", allResults.transactions?.executionTime || 0, (allResults.transactions?.errors || []).join('; ')],
      ["Historique & Cache", allResults.history?.success || "N/A", allResults.history?.executionTime || 0, (allResults.history?.errors || []).join('; ')],
      ["Gestion UUID", allResults.uuid?.success || "N/A", allResults.uuid?.executionTime || 0, (allResults.uuid?.errors || []).join('; ')],
      ["Scénarios Réels", allResults.scenarios?.success || "N/A", allResults.scenarios?.executionTime || 0, (allResults.scenarios?.errors || []).join('; ')],
      ["Gestion Erreurs", allResults.errorHandling?.success || "N/A", allResults.errorHandling?.executionTime || 0, (allResults.errorHandling?.errors || []).join('; ')],
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    saveAs(encodedUri, `audit_summary_${new Date().toISOString().split('T')[0]}.csv`);
    toast({ title: "Export réussi", description: "Rapport CSV téléchargé." });
  };

  const ResultStatus = ({ result }) => {
    if (!result) return <Badge variant="outline" className="text-gray-400">Non exécuté</Badge>;
    return result.success ? 
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-300"><CheckCircle2 className="w-3 h-3 mr-1"/> Succès</Badge> : 
      <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1"/> Échec</Badge>;
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Tests de Corrections - Administration</title>
      </Helmet>

      <div className="space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <ShieldAlert className="h-8 w-8 text-blue-600" /> Tests des Corrections
            </h1>
            <p className="text-muted-foreground mt-1">Suite de tests automatisée pour valider la stabilité des récentes modifications (UUID, Atomiques, Pagination).</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={runAllTests} disabled={isTestingAll} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              {isTestingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
              Exécuter tout
            </Button>
            <Button onClick={exportJSON} variant="outline" className="gap-2" disabled={!allResults.transactions}>
              <Download className="h-4 w-4" /> JSON
            </Button>
            <Button onClick={exportCSV} variant="outline" className="gap-2" disabled={!allResults.transactions}>
              <FileText className="h-4 w-4" /> CSV
            </Button>
            <Button onClick={resetResults} variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" /> Reset
            </Button>
          </div>
        </div>

        <TestResultsSummary allResults={allResults} />

        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto md:h-12 bg-gray-100/50 p-1 rounded-xl">
            <TabsTrigger value="transactions" className="gap-2 py-2"><Database className="h-4 w-4 hidden md:block"/> Transactions</TabsTrigger>
            <TabsTrigger value="history" className="gap-2 py-2"><Clock className="h-4 w-4 hidden md:block"/> Historique</TabsTrigger>
            <TabsTrigger value="uuid" className="gap-2 py-2"><ShieldAlert className="h-4 w-4 hidden md:block"/> UUIDs</TabsTrigger>
            <TabsTrigger value="scenarios" className="gap-2 py-2"><ListChecks className="h-4 w-4 hidden md:block"/> Scénarios</TabsTrigger>
            <TabsTrigger value="errors" className="gap-2 py-2"><Zap className="h-4 w-4 hidden md:block"/> Erreurs</TabsTrigger>
          </TabsList>

          {/* TRANSACTIONS TAB */}
          <TabsContent value="transactions" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Transactions Atomiques</CardTitle>
                  <CardDescription>Vérifie la création sécurisée d'une commande via la nouvelle fonction RPC.</CardDescription>
                </div>
                <Button onClick={testTransactions.runTest} disabled={testTransactions.loading} variant="secondary">
                  {testTransactions.loading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <PlayCircle className="h-4 w-4 mr-2"/>} Tester
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-semibold text-sm text-gray-500">Statut :</span>
                  <ResultStatus result={allResults.transactions} />
                  {allResults.transactions && <span className="text-xs text-gray-400"><Clock className="w-3 h-3 inline mr-1"/>{allResults.transactions.executionTime}ms</span>}
                </div>
                <ScrollArea className="h-64 w-full rounded-md border p-4 bg-slate-950 text-slate-300 font-mono text-xs">
                  {allResults.transactions ? (
                    <div className="space-y-1">
                      {allResults.transactions.details.map((d, i) => <div key={i} className="text-green-400">&gt; {d}</div>)}
                      {allResults.transactions.errors.map((e, i) => <div key={i} className="text-red-400 font-bold">[ERREUR] {e}</div>)}
                    </div>
                  ) : "En attente d'exécution..."}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Historique et Cache</CardTitle>
                  <CardDescription>Teste la pagination et les performances du cache (TTL) pour les historiques.</CardDescription>
                </div>
                <Button onClick={testOrderHistory.runTest} disabled={testOrderHistory.loading} variant="secondary">
                  {testOrderHistory.loading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <PlayCircle className="h-4 w-4 mr-2"/>} Tester
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-semibold text-sm text-gray-500">Statut :</span>
                  <ResultStatus result={allResults.history} />
                </div>
                <ScrollArea className="h-64 w-full rounded-md border p-4 bg-slate-950 text-slate-300 font-mono text-xs">
                  {allResults.history ? (
                    <div className="space-y-1">
                      {allResults.history.details.map((d, i) => <div key={i} className="text-blue-400">&gt; {d}</div>)}
                      {allResults.history.errors.map((e, i) => <div key={i} className="text-red-400 font-bold">[ERREUR] {e}</div>)}
                    </div>
                  ) : "En attente d'exécution..."}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* UUID TAB */}
          <TabsContent value="uuid" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Intégrité des UUID</CardTitle>
                  <CardDescription>Valide que l'erreur "invalid syntax for type uuid id=0" est corrigée.</CardDescription>
                </div>
                <Button onClick={testUUID.runTest} disabled={testUUID.loading} variant="secondary">
                  {testUUID.loading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <PlayCircle className="h-4 w-4 mr-2"/>} Tester
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-semibold text-sm text-gray-500">Statut :</span>
                  <ResultStatus result={allResults.uuid} />
                </div>
                <ScrollArea className="h-64 w-full rounded-md border p-4 bg-slate-950 text-slate-300 font-mono text-xs">
                  {allResults.uuid ? (
                    <div className="space-y-1">
                      {allResults.uuid.details.map((d, i) => <div key={i} className="text-purple-400">&gt; {d}</div>)}
                      {allResults.uuid.errors.map((e, i) => <div key={i} className="text-red-400 font-bold">[ERREUR] {e}</div>)}
                    </div>
                  ) : "En attente d'exécution..."}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SCENARIOS TAB */}
          <TabsContent value="scenarios" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Scénarios Utilisateurs</CardTitle>
                  <CardDescription>Tests End-to-End du flux d'achat et suivi de commande.</CardDescription>
                </div>
                <Button onClick={testScenarios.runTest} disabled={testScenarios.loading} variant="secondary">
                  {testScenarios.loading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <PlayCircle className="h-4 w-4 mr-2"/>} Tester
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-semibold text-sm text-gray-500">Statut :</span>
                  <ResultStatus result={allResults.scenarios} />
                </div>
                
                {allResults.scenarios ? (
                  <div className="space-y-3">
                    {allResults.scenarios.steps.map((step, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50/50">
                        <span className="font-medium text-sm text-gray-700">{step.name}</span>
                        {step.status === 'success' && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Passé</Badge>}
                        {step.status === 'failed' && <Badge variant="destructive">Échec</Badge>}
                        {step.status === 'warning' && <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Avertissement</Badge>}
                      </div>
                    ))}
                    {allResults.scenarios.errors.length > 0 && (
                       <div className="mt-4 p-4 bg-red-50 text-red-800 text-sm rounded-lg border border-red-100">
                          <strong>Erreurs rencontrées :</strong>
                          <ul className="list-disc pl-5 mt-2">
                             {allResults.scenarios.errors.map((e, i) => <li key={i}>{e}</li>)}
                          </ul>
                       </div>
                    )}
                  </div>
                ) : (
                   <div className="h-32 flex items-center justify-center text-gray-400 text-sm border border-dashed rounded-lg">En attente d'exécution...</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ERRORS TAB */}
          <TabsContent value="errors" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestion des Erreurs et Timeout</CardTitle>
                  <CardDescription>Simule des pannes réseau, données manquantes et dépassements de délai.</CardDescription>
                </div>
                <Button onClick={testErrors.runTest} disabled={testErrors.loading} variant="secondary">
                  {testErrors.loading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <PlayCircle className="h-4 w-4 mr-2"/>} Tester
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-semibold text-sm text-gray-500">Statut :</span>
                  <ResultStatus result={allResults.errorHandling} />
                </div>
                <ScrollArea className="h-64 w-full rounded-md border p-4 bg-slate-950 text-slate-300 font-mono text-xs">
                  {allResults.errorHandling ? (
                    <div className="space-y-1">
                      {allResults.errorHandling.details.map((d, i) => <div key={i} className="text-green-300">&gt; {d}</div>)}
                      {allResults.errorHandling.errors.map((e, i) => <div key={i} className="text-red-400 font-bold">[ERREUR] {e}</div>)}
                    </div>
                  ) : "En attente d'exécution..."}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminTestCorrectionsPage;