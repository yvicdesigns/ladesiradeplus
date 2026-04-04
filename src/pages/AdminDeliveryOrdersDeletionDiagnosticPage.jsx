import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { databaseAuditUtils } from '@/lib/databaseAuditUtils';
import { compareTables } from '@/lib/tableStructureComparison';
import { traceDeliveryOrderDeletion } from '@/lib/deliveryOrderDeletionTracer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, Database, FileDiff, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const AdminDeliveryOrdersDeletionDiagnosticPage = () => {
  const [loading, setLoading] = useState(false);
  const [schemaDelivery, setSchemaDelivery] = useState(null);
  const [schemaRestaurant, setSchemaRestaurant] = useState(null);
  const [comparisonReport, setComparisonReport] = useState(null);
  
  const [orderIdToTrace, setOrderIdToTrace] = useState('');
  const [traceReport, setTraceReport] = useState(null);
  const [isTracing, setIsTracing] = useState(false);

  useEffect(() => {
    loadSchemas();
  }, []);

  const loadSchemas = async () => {
    setLoading(true);
    try {
      const delivery = await databaseAuditUtils.auditTable('delivery_orders');
      const restaurant = await databaseAuditUtils.auditTable('restaurant_orders');
      const compare = await compareTables('delivery_orders', 'restaurant_orders');
      
      setSchemaDelivery(delivery);
      setSchemaRestaurant(restaurant);
      setComparisonReport(compare);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrace = async () => {
    if (!orderIdToTrace) return;
    setIsTracing(true);
    setTraceReport(null);
    try {
      const report = await traceDeliveryOrderDeletion(orderIdToTrace);
      setTraceReport(report);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTracing(false);
    }
  };

  const renderSchemaTable = (schema) => {
    if (!schema || !schema.columns) return <p>No data</p>;
    return (
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Column Name</TableHead>
              <TableHead>Data Type</TableHead>
              <TableHead>Nullable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schema.columns.map(col => (
              <TableRow key={col.column_name}>
                <TableCell className="font-medium">{col.column_name}</TableCell>
                <TableCell className="font-mono text-xs">{col.data_type}</TableCell>
                <TableCell>{col.is_nullable === 'YES' ? <Badge variant="outline">YES</Badge> : <Badge variant="secondary">NO</Badge>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Database className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Diagnostics de Suppression (Delivery Orders)</h1>
        </div>

        <Tabs defaultValue="tracer" className="space-y-4">
          <TabsList className="bg-white border p-1">
            <TabsTrigger value="tracer" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <Activity className="w-4 h-4 mr-2" /> Tracer de Suppression
            </TabsTrigger>
            <TabsTrigger value="compare" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
              <FileDiff className="w-4 h-4 mr-2" /> Comparaison de Schémas
            </TabsTrigger>
            <TabsTrigger value="schemas" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">
              <Database className="w-4 h-4 mr-2" /> Schémas Complets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracer">
            <Card>
              <CardHeader>
                <CardTitle>Traceur de Dépendances de Commande</CardTitle>
                <CardDescription>Entrez un ID de 'delivery_orders' pour voir exactement quelles données lui sont rattachées et comment la suppression se déroulera.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2 max-w-md">
                  <Input 
                    placeholder="ID de delivery_orders (UUID)" 
                    value={orderIdToTrace} 
                    onChange={(e) => setOrderIdToTrace(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <Button onClick={handleTrace} disabled={isTracing || !orderIdToTrace}>
                    {isTracing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                    Tracer
                  </Button>
                </div>

                {traceReport && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className={`p-4 rounded-lg border ${traceReport.status === 'ready' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                       <h3 className="font-bold flex items-center gap-2 mb-2">
                         {traceReport.status === 'ready' ? <CheckCircle2 className="text-amber-600 w-5 h-5"/> : <AlertCircle className="text-red-600 w-5 h-5"/>}
                         Statut du traçage: {traceReport.status.toUpperCase()}
                       </h3>
                       {traceReport.error && <p className="text-red-600 text-sm">{traceReport.error}</p>}
                    </div>

                    {traceReport.status === 'ready' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="shadow-sm">
                          <CardHeader className="py-3 bg-gray-50 border-b">
                            <CardTitle className="text-base">Données Associées Trouvées</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-center border-b pb-2">
                              <span className="text-sm font-medium">Delivery Order</span>
                              <Badge>{traceReport.relatedRecords.deliveryOrder ? 'Trouvé' : 'Introuvable'}</Badge>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                              <span className="text-sm font-medium">Parent Order (orders)</span>
                              <Badge variant="secondary">{traceReport.relatedRecords.parentOrder ? `ID: ${traceReport.relatedRecords.parentOrder.id.slice(0,8)}...` : 'Aucun'}</Badge>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                              <span className="text-sm font-medium">Order Items</span>
                              <Badge variant="outline">{traceReport.relatedRecords.orderItems?.length || 0} articles</Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="shadow-sm border-blue-200">
                          <CardHeader className="py-3 bg-blue-50 border-b border-blue-200">
                            <CardTitle className="text-base text-blue-800">Plan de Suppression Recommandé</CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-gray-50/50">
                                  <TableHead className="w-12">Ordre</TableHead>
                                  <TableHead>Table</TableHead>
                                  <TableHead>Action</TableHead>
                                  <TableHead>Lignes</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {traceReport.proposedPlan.map((step, i) => (
                                  <TableRow key={i}>
                                    <TableCell className="font-bold">{step.order}</TableCell>
                                    <TableCell className="font-mono text-xs">{step.table}</TableCell>
                                    <TableCell><Badge variant="destructive">{step.action}</Badge></TableCell>
                                    <TableCell>{step.count}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto text-green-400 font-mono text-xs">
                      <pre>{JSON.stringify(traceReport, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compare">
            <Card>
              <CardHeader>
                <CardTitle>Analyse Comparative: Delivery vs Restaurant</CardTitle>
                <CardDescription>Comprendre pourquoi la suppression fonctionne sur une table et pas l'autre.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center gap-2"><Loader2 className="animate-spin"/> Chargement...</div>
                ) : comparisonReport ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 whitespace-pre-wrap font-mono text-sm text-purple-900">
                      {comparisonReport.analysis}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border p-4 rounded-md">
                        <h4 className="font-bold mb-2">Unique à {comparisonReport.tableA}</h4>
                        <div className="flex flex-wrap gap-1">
                          {comparisonReport.comparison.uniqueToA.map(c => <Badge key={c} variant="secondary">{c}</Badge>)}
                        </div>
                      </div>
                      <div className="border p-4 rounded-md">
                        <h4 className="font-bold mb-2">Unique à {comparisonReport.tableB}</h4>
                        <div className="flex flex-wrap gap-1">
                          {comparisonReport.comparison.uniqueToB.map(c => <Badge key={c} variant="secondary">{c}</Badge>)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : <p>Erreur de chargement du rapport.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schemas">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle>Schema: delivery_orders</CardTitle></CardHeader>
                  <CardContent>
                    {loading ? <Loader2 className="animate-spin"/> : renderSchemaTable(schemaDelivery)}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Schema: restaurant_orders</CardTitle></CardHeader>
                  <CardContent>
                    {loading ? <Loader2 className="animate-spin"/> : renderSchemaTable(schemaRestaurant)}
                  </CardContent>
                </Card>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminDeliveryOrdersDeletionDiagnosticPage;