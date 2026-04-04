import React, { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generateTestOrders } from '@/lib/testDataGenerator';
import { OrderDeletionTestService } from '@/lib/OrderDeletionTestService';
import { OrderDeletionTestReportGenerator } from '@/components/OrderDeletionTestReportGenerator';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Play, Database, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const AdminOrderDeletionTestPage = () => {
  const { toast } = useToast();
  const [testOrders, setTestOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleGenerateData = async () => {
    setLoading(true);
    const res = await generateTestOrders();
    if (res.success) {
      setTestOrders(res.data);
      toast({ title: "Données générées", description: "10 commandes de test créées et sauvegardées." });
    } else {
      toast({ variant: "destructive", title: "Erreur", description: res.error });
    }
    setLoading(false);
  };

  const runAllTests = async () => {
    if (testOrders.length < 8) {
      toast({ variant: "destructive", title: "Test impossible", description: "Veuillez générer les données de test d'abord." });
      return;
    }

    setLoading(true);
    const newResults = [];

    // Test specific statuses
    newResults.push(await OrderDeletionTestService.runSingleTest('Delete Pending Order', testOrders[0].id));
    newResults.push(await OrderDeletionTestService.runSingleTest('Delete Confirmed Order', testOrders[1].id));
    newResults.push(await OrderDeletionTestService.runSingleTest('Delete In Delivery Order', testOrders[4].id));
    newResults.push(await OrderDeletionTestService.runSingleTest('Delete Delivered Order', testOrders[5].id));
    newResults.push(await OrderDeletionTestService.runSingleTest('Delete Cancelled Order', testOrders[6].id));
    
    // Test duplicate
    newResults.push(await OrderDeletionTestService.testDeleteDuplicateDeletion(testOrders[0].id));

    // Test multiple
    const idsToBulk = [testOrders[2].id, testOrders[3].id];
    newResults.push(await OrderDeletionTestService.testDeleteMultipleOrders(idsToBulk));

    setResults(newResults);
    setLoading(false);
    toast({ title: "Tests terminés", description: "Vérifiez les résultats ci-dessous." });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order Deletion Test Suite</h1>
          <p className="text-muted-foreground text-sm">Interface de diagnostic pour tester la suppression en cascade des commandes.</p>
        </div>

        <Alert variant="destructive" className="bg-amber-50 text-amber-800 border-amber-200">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <AlertTitle>Attention</AlertTitle>
          <AlertDescription>
            Cette page crée et supprime des données réelles dans la base de données. Ne pas utiliser sur des commandes clients réelles.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5"/> 1. Test Data Management</CardTitle>
              <CardDescription>Générez des données factices avec différents statuts pour les tests.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleGenerateData} disabled={loading} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Générer 10 Commandes de Test"}
              </Button>
              {testOrders.length > 0 && (
                <div className="text-xs bg-slate-100 p-3 rounded-md max-h-40 overflow-auto">
                  <p className="font-bold mb-2">IDs générés :</p>
                  {testOrders.map(o => <div key={o.id}>{o.id.substring(0,8)}... - {o.status}</div>)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Play className="h-5 w-5"/> 2. Execution des Tests</CardTitle>
              <CardDescription>Lancez les scénarios de suppression et de vérification d'intégrité.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={runAllTests} disabled={loading || testOrders.length === 0} variant="secondary" className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Lancer la suite de tests complète"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {results.length > 0 && (
          <OrderDeletionTestReportGenerator results={results} />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrderDeletionTestPage;