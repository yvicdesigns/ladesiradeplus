import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { OrderIdSyncService } from '@/lib/OrderIdSyncService';
import { OrderIdMigrationService } from '@/lib/OrderIdMigrationService';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatOrderIdForDisplay } from '@/lib/orderIdVerification';

export const AdminOrderIdSyncPage = () => {
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [report, setReport] = useState(null);
  const { toast } = useToast();

  const runAudit = async () => {
    setLoading(true);
    try {
      const result = await OrderIdMigrationService.auditAllOrders();
      if (result.success) {
        setReport(result.report);
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
    runAudit();
  }, []);

  const handleFixAll = async () => {
    setFixing(true);
    try {
      const result = await OrderIdMigrationService.fixAllMismatchedOrderIds();
      if (result.success) {
        toast({ title: 'Migration Terminée', description: result.message });
        runAudit(); // Refresh the report
      } else {
        toast({ variant: 'destructive', title: 'Erreur', description: result.error || result.message });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur', description: err.message });
    } finally {
      setFixing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Synchronisation des IDs de Commandes</h1>
            <p className="text-sm text-gray-500">Vérification de la cohérence entre delivery_orders et orders</p>
          </div>
          <Button onClick={runAudit} disabled={loading || fixing} variant="outline" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Auditer
          </Button>
        </div>

        {loading && !report ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : report ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-500">Total Delivery Orders</p>
                  <h3 className="text-3xl font-bold mt-2">{report.totalDeliveryOrders}</h3>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-500">Total Orders (Parent)</p>
                  <h3 className="text-3xl font-bold mt-2">{report.totalOrders}</h3>
                </CardContent>
              </Card>
              <Card className={`border ${report.nullOrderIdCount > 0 ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                <CardContent className="p-6">
                  <p className={`text-sm font-medium ${report.nullOrderIdCount > 0 ? 'text-red-800' : 'text-amber-800'}`}>Sans Parent (NULL)</p>
                  <h3 className={`text-3xl font-bold mt-2 ${report.nullOrderIdCount > 0 ? 'text-red-600' : 'text-amber-600'}`}>{report.nullOrderIdCount}</h3>
                </CardContent>
              </Card>
              <Card className={`border ${report.missingParentCount > 0 ? 'border-amber-200 bg-amber-50' : 'border-amber-200 bg-amber-50'}`}>
                <CardContent className="p-6">
                  <p className={`text-sm font-medium ${report.missingParentCount > 0 ? 'text-amber-800' : 'text-amber-800'}`}>Parent Introuvable</p>
                  <h3 className={`text-3xl font-bold mt-2 ${report.missingParentCount > 0 ? 'text-amber-600' : 'text-amber-600'}`}>{report.missingParentCount}</h3>
                </CardContent>
              </Card>
            </div>

            {report.nullOrderIdCount === 0 && report.missingParentCount === 0 ? (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-amber-900">Synchronisation Parfaite</h3>
                    <p className="text-amber-700 mt-2">Tous les enregistrements `delivery_orders` sont correctement liés à un enregistrement `orders` parent valide.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-amber-200">
                <CardHeader className="bg-amber-50 border-b border-green-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-amber-900 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5"/> Mismatches Détectés
                    </CardTitle>
                    <CardDescription className="text-amber-700">Ces enregistrements posent des problèmes d'affichage dans le suivi.</CardDescription>
                  </div>
                  <Button onClick={handleFixAll} disabled={fixing} className="bg-green-600 hover:bg-green-700 text-white">
                     {fixing ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Database className="w-4 h-4 mr-2"/>}
                     Réparer Automatiquement
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <div className="p-4 space-y-4">
                       {report.nullOrderIdRecords.map(doRec => (
                         <div key={doRec.id} className="p-4 bg-red-50 border border-red-100 rounded-lg text-sm">
                            <div className="font-bold text-red-900 mb-1">ID Parent NULL</div>
                            <div className="grid grid-cols-2 gap-2 text-red-800">
                              <div>Delivery Order ID: <span className="font-mono bg-white px-1 py-0.5 rounded">{formatOrderIdForDisplay(doRec.id)}</span></div>
                              <div>Date: {new Date(doRec.created_at).toLocaleString()}</div>
                            </div>
                         </div>
                       ))}
                       {report.missingParentRecords.map(doRec => (
                         <div key={doRec.id} className="p-4 bg-amber-50 border border-green-100 rounded-lg text-sm">
                            <div className="font-bold text-amber-900 mb-1">Parent UUID Introuvable dans orders</div>
                            <div className="grid grid-cols-2 gap-2 text-amber-800">
                              <div>Delivery Order ID: <span className="font-mono bg-white px-1 py-0.5 rounded">{formatOrderIdForDisplay(doRec.id)}</span></div>
                              <div>Orphaned Parent ID: <span className="font-mono bg-white px-1 py-0.5 rounded">{formatOrderIdForDisplay(doRec.order_id)}</span></div>
                            </div>
                         </div>
                       ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default AdminOrderIdSyncPage;