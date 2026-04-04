import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  RefreshCw, 
  Database, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Info, 
  Table2, 
  Truck 
} from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';

export const AdminDeliveryOrdersDiagnosticPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [dOrders, setDOrders] = useState([]);
  const [mOrders, setMOrders] = useState([]);
  
  const [dStats, setDStats] = useState({ total: 0, active: 0, deleted: 0, nullDeleted: 0, byStatus: {} });
  const [mStats, setMStats] = useState({ total: 0, active: 0, deleted: 0, nullDeleted: 0, byStatus: {} });
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch delivery_orders
      const { data: deliveryData, error: deliveryErr } = await supabase
        .from('delivery_orders')
        .select('id, status, is_deleted, deleted_at, created_at, payment_status, order_id')
        .order('created_at', { ascending: false });
        
      if (deliveryErr) throw deliveryErr;
      
      // Fetch orders
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select('id, status, type, is_deleted, deleted_at, created_at')
        .order('created_at', { ascending: false });
        
      if (ordersErr) throw ordersErr;

      setDOrders(deliveryData || []);
      setMOrders(ordersData || []);
      
      // Calculate delivery_orders stats
      const dActive = deliveryData.filter(o => o.is_deleted === false).length;
      const dDeleted = deliveryData.filter(o => o.is_deleted === true).length;
      const dNull = deliveryData.filter(o => o.is_deleted === null).length;
      
      const dStatusCounts = deliveryData.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      setDStats({
        total: deliveryData.length,
        active: dActive,
        deleted: dDeleted,
        nullDeleted: dNull,
        byStatus: dStatusCounts
      });

      // Calculate orders stats
      const mActive = ordersData.filter(o => o.is_deleted === false).length;
      const mDeleted = ordersData.filter(o => o.is_deleted === true).length;
      const mNull = ordersData.filter(o => o.is_deleted === null).length;
      
      const mStatusCounts = ordersData.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      setMStats({
        total: ordersData.length,
        active: mActive,
        deleted: mDeleted,
        nullDeleted: mNull,
        byStatus: mStatusCounts
      });

    } catch (err) {
      console.error("Diagnostic Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Badge Queries Replication
  const badgeStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'in_transit'];
  const unreadQueryMatches = dOrders.filter(o => badgeStatuses.includes(o.status) && o.is_deleted === false);
  
  // Cross-reference to find orphans (Delivery order is active, but parent order is deleted/null)
  const activeDeliveryOrders = dOrders.filter(o => o.is_deleted === false);
  const orphanedDeliveryOrders = activeDeliveryOrders.filter(dOrder => {
      const parent = mOrders.find(o => o.id === dOrder.order_id);
      return !parent || parent.is_deleted !== false;
  });

  const PageLoader = () => (
    <div className="space-y-4">
      <Skeleton className="h-12 w-[300px]" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Database className="h-6 w-6" />
              </div>
              Analyse Base de Données
            </h1>
            <p className="text-muted-foreground mt-1">
              Diagnostic complet des tables <code className="text-xs bg-gray-100 px-1 rounded">delivery_orders</code> et <code className="text-xs bg-gray-100 px-1 rounded">orders</code>
            </p>
          </div>
          <Button onClick={fetchData} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Rafraîchir les données
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erreur d'analyse</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? <PageLoader /> : (
          <Tabs defaultValue="report" className="w-full space-y-6">
            <TabsList className="bg-white border p-1 rounded-xl shadow-sm w-full flex-wrap h-auto justify-start">
              <TabsTrigger value="report" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"><Activity className="w-4 h-4 mr-2"/> Rapport & Root Cause</TabsTrigger>
              <TabsTrigger value="delivery"><Truck className="w-4 h-4 mr-2"/> Table delivery_orders</TabsTrigger>
              <TabsTrigger value="orders"><Table2 className="w-4 h-4 mr-2"/> Table orders</TabsTrigger>
              <TabsTrigger value="queries"><Search className="w-4 h-4 mr-2"/> Vérification Requêtes</TabsTrigger>
            </TabsList>

            {/* PART E & D: REPORT AND ROOT CAUSE */}
            <TabsContent value="report" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500"/> Analyse du décalage (Root Cause)</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <p className="text-sm text-gray-700">
                      Les badges de notification affichent un total de <strong>{unreadQueryMatches.length}</strong> commandes, mais la table d'administration peut en afficher 0. Pourquoi ?
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                      <li>
                        <strong>Les hooks (Badges) :</strong> Interrogent <strong>uniquement</strong> la table <code className="bg-gray-100 px-1 rounded">delivery_orders</code> et filtrent par <code>is_deleted = false</code>.
                      </li>
                      <li>
                        <strong>La page d'administration :</strong> Utilise généralement une jointure (implicite ou explicite) ou dépend des données de la table <code className="bg-gray-100 px-1 rounded">orders</code>. Si l'enregistrement parent dans <code className="bg-gray-100 px-1 rounded">orders</code> est supprimé mais pas l'enfant, l'enfant devient "orphelin".
                      </li>
                      <li>
                        <strong>Enregistrements orphelins :</strong> Nous avons trouvé <strong>{orphanedDeliveryOrders.length}</strong> enregistrements dans <code className="bg-gray-100 px-1 rounded">delivery_orders</code> dont le parent dans <code className="bg-gray-100 px-1 rounded">orders</code> est manquant ou marqué comme supprimé.
                      </li>
                      <li>
                        <strong>Valeurs NULL :</strong> Il y a {dStats.nullDeleted} enregistrements avec <code>is_deleted = NULL</code>. Si vos requêtes utilisent <code>eq('is_deleted', false)</code>, les NULL sont ignorés.
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-amber-500"/> Recommandations</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <Alert className="bg-amber-50 border-amber-200">
                      <Info className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800">Action Corrective 1</AlertTitle>
                      <AlertDescription className="text-amber-700 text-xs">
                        Uniformiser les suppressions. Lors de la suppression d'une commande (orders), assurer la suppression en cascade du delivery_order correspondant (mettre son is_deleted à true).
                      </AlertDescription>
                    </Alert>
                    <Alert className="bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800">Action Corrective 2</AlertTitle>
                      <AlertDescription className="text-amber-700 text-xs">
                        Nettoyer les valeurs NULL. Exécuter : <code>UPDATE delivery_orders SET is_deleted = false WHERE is_deleted IS NULL;</code>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>

              {orphanedDeliveryOrders.length > 0 && (
                <Card className="border-red-200">
                  <CardHeader className="bg-red-50 text-red-900 border-b border-red-100">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" /> 
                      Détail des Enregistrements Orphelins ({orphanedDeliveryOrders.length})
                    </CardTitle>
                    <CardDescription className="text-red-700">
                      Ces enregistrements apparaissent dans le badge mais sont invisibles dans l'interface car leur commande parente est supprimée.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Delivery ID</TableHead>
                            <TableHead>Order ID (Parent)</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Date Création</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orphanedDeliveryOrders.map(o => (
                            <TableRow key={o.id}>
                              <TableCell className="font-mono text-xs">{o.id.substring(0,8)}...</TableCell>
                              <TableCell className="font-mono text-xs text-red-600">{o.order_id?.substring(0,8)}...</TableCell>
                              <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                              <TableCell className="text-xs">{formatDateTime(o.created_at)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* PART A: DELIVERY ORDERS */}
            <TabsContent value="delivery" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Records</p><p className="text-2xl font-bold">{dStats.total}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Actifs (is_deleted=false)</p><p className="text-2xl font-bold text-amber-600">{dStats.active}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Supprimés (is_deleted=true)</p><p className="text-2xl font-bold text-red-600">{dStats.deleted}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">NULL (is_deleted=null)</p><p className="text-2xl font-bold text-amber-600">{dStats.nullDeleted}</p></CardContent></Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Répartition par Statut</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {Object.entries(dStats.byStatus).map(([status, count]) => (
                    <Badge key={status} variant="secondary" className="px-3 py-1 text-sm">
                      {status || 'NULL'}: <strong>{count}</strong>
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Données Brutes (delivery_orders) - 50 derniers</CardTitle>
                </CardHeader>
                <div className="max-h-[400px] overflow-auto border-t">
                  <Table>
                    <TableHeader className="bg-gray-50 sticky top-0">
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>is_deleted</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dOrders.slice(0, 50).map(o => (
                        <TableRow key={o.id}>
                          <TableCell className="font-mono text-xs">{o.id.substring(0,8)}...</TableCell>
                          <TableCell className="font-mono text-xs">{o.order_id?.substring(0,8)}...</TableCell>
                          <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                          <TableCell>
                            {o.is_deleted === true ? <Badge variant="destructive">True</Badge> : 
                             o.is_deleted === false ? <Badge className="bg-amber-500">False</Badge> : 
                             <Badge variant="outline" className="text-amber-500">NULL</Badge>}
                          </TableCell>
                          <TableCell className="text-xs">{formatDateTime(o.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            {/* PART B: ORDERS */}
            <TabsContent value="orders" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Records</p><p className="text-2xl font-bold">{mStats.total}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Actifs (is_deleted=false)</p><p className="text-2xl font-bold text-amber-600">{mStats.active}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Supprimés (is_deleted=true)</p><p className="text-2xl font-bold text-red-600">{mStats.deleted}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">NULL (is_deleted=null)</p><p className="text-2xl font-bold text-amber-600">{mStats.nullDeleted}</p></CardContent></Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Répartition par Statut</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {Object.entries(mStats.byStatus).map(([status, count]) => (
                    <Badge key={status} variant="secondary" className="px-3 py-1 text-sm">
                      {status || 'NULL'}: <strong>{count}</strong>
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Données Brutes (orders) - 50 derniers</CardTitle>
                </CardHeader>
                <div className="max-h-[400px] overflow-auto border-t">
                  <Table>
                    <TableHeader className="bg-gray-50 sticky top-0">
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>is_deleted</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mOrders.slice(0, 50).map(o => (
                        <TableRow key={o.id}>
                          <TableCell className="font-mono text-xs">{o.id.substring(0,8)}...</TableCell>
                          <TableCell><Badge variant="outline">{o.type}</Badge></TableCell>
                          <TableCell><Badge variant="secondary">{o.status}</Badge></TableCell>
                          <TableCell>
                            {o.is_deleted === true ? <Badge variant="destructive">True</Badge> : 
                             o.is_deleted === false ? <Badge className="bg-amber-500">False</Badge> : 
                             <Badge variant="outline" className="text-amber-500">NULL</Badge>}
                          </TableCell>
                          <TableCell className="text-xs">{formatDateTime(o.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            {/* PART C: QUERIES REPLICATION */}
            <TabsContent value="queries" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>1. Requête: useUnreadDeliveryOrders / useNewOrderNotificationBadge</CardTitle>
                  <CardDescription className="font-mono text-xs mt-2 bg-gray-100 p-2 rounded text-gray-800">
                    SELECT count(*) FROM delivery_orders<br/>
                    WHERE status IN ('pending', 'confirmed', 'preparing', 'ready', 'in_transit')<br/>
                    AND is_deleted = false
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-center min-w-[150px]">
                      <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Résultat Badge</p>
                      <p className="text-3xl font-bold text-indigo-900">{unreadQueryMatches.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. Requête: AdminDeliveryOrdersPage (Interface principale)</CardTitle>
                  <CardDescription className="font-mono text-xs mt-2 bg-gray-100 p-2 rounded text-gray-800">
                    SELECT * FROM delivery_orders<br/>
                    JOIN orders ON orders.id = delivery_orders.order_id<br/>
                    WHERE delivery_orders.is_deleted = false<br/>
                    AND orders.is_deleted = false
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-center min-w-[150px]">
                      <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Résultat Table</p>
                      <p className="text-3xl font-bold text-emerald-900">{activeDeliveryOrders.length - orphanedDeliveryOrders.length}</p>
                    </div>
                  </div>
                  <Alert className="bg-amber-50 text-amber-900 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle>Explication du décalage</AlertTitle>
                    <AlertDescription>
                      Le badge affiche <strong>{unreadQueryMatches.length}</strong> car il regarde uniquement la table <code>delivery_orders</code>. 
                      La table affiche <strong>{activeDeliveryOrders.length - orphanedDeliveryOrders.length}</strong> car elle nécessite que la table parente <code>orders</code> soit également active.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDeliveryOrdersDiagnosticPage;