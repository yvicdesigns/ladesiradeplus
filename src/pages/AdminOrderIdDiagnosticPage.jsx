import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { OrderIdMismatchAnalyzer } from '@/lib/OrderIdMismatchAnalyzer';
import { OrderIdFixService } from '@/lib/OrderIdFixService';
import { formatOrderIdForDisplay } from '@/lib/orderIdVerification';
import { Loader2, AlertTriangle, Link as LinkIcon, RefreshCw, FileJson } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export const AdminOrderIdDiagnosticPage = () => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [fixing, setFixing] = useState(false);
  const { toast } = useToast();

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const result = await OrderIdMismatchAnalyzer.analyzeRecentOrders(48);
      if (result.success) {
        setAnalysis(result.analysis);
      } else {
        toast({ variant: 'destructive', title: 'Erreur', description: result.error });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, []);

  const handleFixMismatches = async () => {
    if (!analysis || analysis.mismatchedPairs.length === 0) return;
    setFixing(true);
    try {
      const result = await OrderIdFixService.fixOrphanedDeliveryOrders(analysis.mismatchedPairs);
      if (result.success) {
        toast({ title: 'Succès', description: `${result.fixed} enregistrements corrigés.` });
        runAnalysis(); // Refresh
      } else {
        toast({ variant: 'destructive', title: 'Erreur', description: result.message });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur', description: err.message });
    } finally {
      setFixing(false);
    }
  };

  const exportJson = () => {
    if (!analysis) return;
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order_id_diagnostic_${new Date().toISOString()}.json`;
    a.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Diagnostic des IDs de Commandes</h1>
            <p className="text-sm text-gray-500">Analyse de la cohérence entre orders et delivery_orders (48h)</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={runAnalysis} disabled={loading} variant="outline" className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button onClick={exportJson} disabled={!analysis} className="gap-2">
              <FileJson className="w-4 h-4" /> Export JSON
            </Button>
          </div>
        </div>

        {loading && !analysis ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : analysis ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-500">Total Orders (48h)</p>
                  <h3 className="text-3xl font-bold mt-2">{analysis.totalOrders}</h3>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-500">Total Delivery Orders</p>
                  <h3 className="text-3xl font-bold mt-2">{analysis.totalDeliveryOrders}</h3>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-amber-800">Orphaned Orders</p>
                  <h3 className="text-3xl font-bold text-amber-600 mt-2">{analysis.orphanedOrders.length}</h3>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-red-800">Orphaned Delivery Orders</p>
                  <h3 className="text-3xl font-bold text-red-600 mt-2">{analysis.orphanedDeliveryOrders.length}</h3>
                </CardContent>
              </Card>
            </div>

            {analysis.recommendations.length > 0 && (
              <Card className="border-yellow-200">
                <CardHeader className="bg-yellow-50 pb-4 border-b border-yellow-100">
                  <CardTitle className="text-yellow-800 text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Recommandations et Alertes
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="list-disc pl-5 space-y-2 text-sm text-yellow-900">
                    {analysis.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                  </ul>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Delivery Orders sans Parent</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {analysis.orphanedDeliveryOrders.length === 0 ? (
                      <p className="text-sm text-gray-500 italic p-4 text-center">Aucune anomalie détectée</p>
                    ) : (
                      <div className="space-y-4 pr-4">
                        {analysis.orphanedDeliveryOrders.map(doRecord => (
                          <div key={doRecord.id} className="p-3 border rounded-lg bg-gray-50 text-xs">
                            <div className="flex justify-between mb-1">
                              <span className="font-mono font-bold text-red-600">DO: {formatOrderIdForDisplay(doRecord.id)}</span>
                              <Badge variant="outline">{doRecord.status}</Badge>
                            </div>
                            <div className="text-gray-600">
                              Attendu Order ID: <span className="font-mono text-gray-400">{doRecord.order_id || 'NULL'}</span>
                            </div>
                            <div className="text-gray-500 mt-1">Créé le: {new Date(doRecord.created_at).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Paires Mismatched (Auto-Correction Possible)</CardTitle>
                  {analysis.mismatchedPairs.length > 0 && (
                    <Button size="sm" onClick={handleFixMismatches} disabled={fixing} className="bg-green-600 hover:bg-green-700">
                      {fixing ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <LinkIcon className="w-4 h-4 mr-2"/>}
                      Lier ({analysis.mismatchedPairs.length})
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {analysis.mismatchedPairs.length === 0 ? (
                      <p className="text-sm text-gray-500 italic p-4 text-center">Aucune correspondance évidente trouvée</p>
                    ) : (
                      <div className="space-y-4 pr-4">
                        {analysis.mismatchedPairs.map((pair, idx) => (
                          <div key={idx} className="p-3 border border-amber-200 rounded-lg bg-amber-50 text-xs space-y-2">
                            <div>
                              <strong className="text-gray-700">Main Order:</strong>
                              <div className="font-mono">{formatOrderIdForDisplay(pair.suggestedOrder.id)}</div>
                              <div className="text-gray-500">{new Date(pair.suggestedOrder.created_at).toLocaleString()}</div>
                            </div>
                            <div className="flex justify-center"><LinkIcon className="w-4 h-4 text-amber-500" /></div>
                            <div>
                              <strong className="text-gray-700">Orphan Delivery Order:</strong>
                              <div className="font-mono">{formatOrderIdForDisplay(pair.orphanedDeliveryOrder.id)}</div>
                              <div className="text-gray-500">{new Date(pair.orphanedDeliveryOrder.created_at).toLocaleString()}</div>
                            </div>
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200">{pair.confidence}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default AdminOrderIdDiagnosticPage;