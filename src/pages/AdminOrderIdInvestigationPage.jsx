import React, { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { OrderIdTraceService } from '@/lib/OrderIdTraceService';
import { Search, Loader2, Database, AlertCircle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatOrderIdForDisplay } from '@/lib/orderIdVerification';

export const AdminOrderIdInvestigationPage = () => {
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchId.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      // Try tracing as a main order first
      let trace = await OrderIdTraceService.traceOrderById(searchId.trim());
      
      // If not found, try as delivery order
      if (!trace.foundInOrders) {
         const doTrace = await OrderIdTraceService.traceDeliveryOrderById(searchId.trim());
         if (doTrace.foundInDeliveryOrders) {
            trace = {
               type: 'delivery_order_search',
               ...doTrace
            };
         }
      } else {
         trace.type = 'main_order_search';
      }

      setResult(trace);
      
      if (!trace.foundInOrders && !trace.foundInDeliveryOrders) {
         toast({ variant: 'destructive', title: 'Non trouvé', description: "Cet ID n'existe ni dans orders ni dans delivery_orders." });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const renderJsonBlock = (title, data) => (
    <div className="mt-4">
      <h4 className="font-bold text-sm mb-2 text-gray-700 flex items-center gap-2">
        <Database className="w-4 h-4"/> {title}
      </h4>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investigation d'ID Unique</h1>
          <p className="text-sm text-gray-500">Traçage complet d'un ID de commande à travers la base de données</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Collez un UUID (Order ID ou Delivery Order ID)..." 
                  className="pl-9 font-mono"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={loading || !searchId.trim()} className="w-32">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tracer"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6 animate-in fade-in">
            {result.type === 'main_order_search' && result.foundInOrders && (
              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50 border-b border-blue-100">
                  <CardTitle className="text-blue-900 flex justify-between items-center">
                    <span>Résultat: Table `orders` principale</span>
                    <Badge variant="outline" className="bg-white">Type: {result.orderRecord?.type}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Order ID</p>
                      <p className="font-mono text-xs mt-1 truncate" title={result.orderRecord.id}>{formatOrderIdForDisplay(result.orderRecord.id)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Status</p>
                      <Badge className="mt-1">{result.orderRecord.status}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Date</p>
                      <p className="text-sm mt-1">{new Date(result.orderRecord.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Liaisons Delivery</p>
                      <p className="text-sm mt-1 font-bold text-blue-600">{result.deliveryOrders?.length || 0} enregistrement(s)</p>
                    </div>
                  </div>

                  {result.deliveryOrders && result.deliveryOrders.length > 0 ? (
                    <div className="mt-6 border-t pt-6">
                      <h4 className="font-bold mb-4 flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-blue-500"/> Enregistrements `delivery_orders` liés (FK)
                      </h4>
                      {result.deliveryOrders.map(doRec => (
                        <div key={doRec.id} className="bg-gray-50 p-4 rounded-lg border text-sm mb-3">
                           <div className="grid grid-cols-2 gap-2 mb-2">
                             <div><span className="text-gray-500">Delivery Order ID:</span> <span className="font-mono">{doRec.id}</span></div>
                             <div><span className="text-gray-500">Order ID (FK):</span> <span className="font-mono">{doRec.order_id}</span></div>
                             <div><span className="text-gray-500">Status:</span> <strong>{doRec.status}</strong></div>
                             <div><span className="text-gray-500">Créé le:</span> {new Date(doRec.created_at).toLocaleString()}</div>
                           </div>
                           {doRec.order_id !== result.orderRecord.id && (
                              <div className="mt-2 p-2 bg-red-100 text-red-800 rounded flex items-center gap-2">
                                <AlertCircle className="w-4 h-4"/> ANOMALIE DE CLÉ ÉTRANGÈRE DÉTECTÉE
                              </div>
                           )}
                        </div>
                      ))}
                    </div>
                  ) : result.orderRecord.type === 'delivery' ? (
                     <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold">Anomalie Détectée</h4>
                          <p className="text-sm">Cette commande est de type 'delivery' mais ne possède aucun enregistrement dans la table `delivery_orders`.</p>
                        </div>
                     </div>
                  ) : null}

                  {renderJsonBlock('Raw Order Data', result.orderRecord)}
                </CardContent>
              </Card>
            )}

            {result.type === 'delivery_order_search' && result.foundInDeliveryOrders && (
              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50 border-b border-purple-100">
                  <CardTitle className="text-purple-900">Résultat: Table `delivery_orders` (Enfant)</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div className="p-3 bg-gray-50 rounded border">
                      <p className="text-xs text-gray-500 font-bold uppercase mb-1">Delivery Order ID (Cible)</p>
                      <p className="font-mono">{result.deliveryOrderRecord.id}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded border">
                      <p className="text-xs text-gray-500 font-bold uppercase mb-1">Parent Order ID (Foreign Key)</p>
                      <p className="font-mono">{result.deliveryOrderRecord.order_id || 'NULL'}</p>
                    </div>
                  </div>

                  {result.isOrphaned ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold">Enregistrement Orphelin</h4>
                          <p className="text-sm">L'identifiant `order_id` référencé n'existe pas dans la table principale `orders`.</p>
                        </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-start gap-3">
                        <Database className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold">Liaison Valide</h4>
                          <p className="text-sm">Le parent existe bien dans la table `orders`.</p>
                        </div>
                    </div>
                  )}

                  {renderJsonBlock('Raw Delivery Order Data', result.deliveryOrderRecord)}
                  {result.parentOrderRecord && renderJsonBlock('Raw Parent Order Data', result.parentOrderRecord)}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrderIdInvestigationPage;