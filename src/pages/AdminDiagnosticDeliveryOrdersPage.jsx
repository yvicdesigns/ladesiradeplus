import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';
import { RefreshCw, Copy, CheckCircle, Clock, Activity, TerminalSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUnreadDeliveryOrders } from '@/hooks/useUnreadDeliveryOrders';
import { runDataIntegrityDiagnostics } from '@/lib/runDiagnostics';

const AdminDiagnosticDeliveryOrdersPage = () => {
  const { toast } = useToast();
  
  // Real Hook State
  const hookState = useUnreadDeliveryOrders();

  // Diagnostics State
  const [loading, setLoading] = useState(false);
  const [queryLogs, setQueryLogs] = useState([]);
  
  const [ordersData, setOrdersData] = useState({
    total: 0,
    deliveryType: 0,
    deletedTrue: 0,
    deletedFalse: 0,
    deletedNull: 0,
    last20: []
  });

  const [deliveryOrdersData, setDeliveryOrdersData] = useState({
    total: 0,
    activeStatuses: 0,
    deletedTrue: 0,
    deletedFalseOrNull: 0,
    last20: []
  });

  const [hookAnalysis, setHookAnalysis] = useState({
    exactQueryResponse: null,
    count: 0,
    error: null,
    executionTime: 0
  });

  const addLog = (name, duration, status, requestDetails, responseData) => {
    setQueryLogs(prev => [{
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      name,
      duration: duration.toFixed(2),
      status,
      requestDetails,
      responseData
    }, ...prev]);
  };

  const executeLoggedQuery = async (name, queryName, queryBuilder) => {
    const start = performance.now();
    try {
      const result = await queryBuilder;
      const end = performance.now();
      
      addLog(name, end - start, result.error ? 'error' : 'success', queryName, result);
      
      if (result.error) throw result.error;
      return result;
    } catch (error) {
      const end = performance.now();
      addLog(name, end - start, 'error', queryName, { error: error.message || error });
      throw error;
    }
  };

  const runDiagnostics = async () => {
    setLoading(true);
    setQueryLogs([]); // Clear previous logs on manual refresh
    
    // Execute the requested console logs script as requested by task
    runDataIntegrityDiagnostics();

    try {
      // --- 1. ORDERS TABLE ANALYSIS ---
      const pOrdersTotal = executeLoggedQuery('Orders: Total Count', 'SELECT count(*) FROM orders', supabase.from('orders').select('*', { count: 'exact', head: true }));
      const pOrdersDelivery = executeLoggedQuery('Orders: type=delivery', "SELECT count(*) FROM orders WHERE type='delivery'", supabase.from('orders').select('*', { count: 'exact', head: true }).eq('type', 'delivery'));
      const pOrdersDelTrue = executeLoggedQuery('Orders: is_deleted=true', "SELECT count(*) FROM orders WHERE is_deleted=true", supabase.from('orders').select('*', { count: 'exact', head: true }).eq('is_deleted', true));
      const pOrdersDelFalse = executeLoggedQuery('Orders: is_deleted=false', "SELECT count(*) FROM orders WHERE is_deleted=false", supabase.from('orders').select('*', { count: 'exact', head: true }).eq('is_deleted', false));
      const pOrdersDelNull = executeLoggedQuery('Orders: is_deleted IS NULL', "SELECT count(*) FROM orders WHERE is_deleted IS NULL", supabase.from('orders').select('*', { count: 'exact', head: true }).is('is_deleted', null));
      const pOrdersLast20 = executeLoggedQuery('Orders: Last 20', "SELECT id, status, type, is_deleted, created_at FROM orders ORDER BY created_at DESC LIMIT 20", supabase.from('orders').select('id, status, type, is_deleted, created_at').order('created_at', { ascending: false }).limit(20));

      // --- 2. DELIVERY_ORDERS TABLE ANALYSIS ---
      const pDelOrdTotal = executeLoggedQuery('DeliveryOrders: Total', 'SELECT count(*) FROM delivery_orders', supabase.from('delivery_orders').select('*', { count: 'exact', head: true }));
      const pDelOrdActive = executeLoggedQuery('DeliveryOrders: Active Statuses', "SELECT count(*) FROM delivery_orders WHERE status IN (...)", supabase.from('delivery_orders').select('*', { count: 'exact', head: true }).in('status', ['pending', 'confirmed', 'preparing', 'ready', 'in_transit', 'arrived_at_customer']));
      const pDelOrdDelTrue = executeLoggedQuery('DeliveryOrders: is_deleted=true', "SELECT count(*) FROM delivery_orders WHERE is_deleted=true", supabase.from('delivery_orders').select('*', { count: 'exact', head: true }).eq('is_deleted', true));
      const pDelOrdLast20 = executeLoggedQuery('DeliveryOrders: Last 20', "SELECT id, status, is_deleted, created_at FROM delivery_orders ORDER BY created_at DESC LIMIT 20", supabase.from('delivery_orders').select('id, status, is_deleted, created_at').order('created_at', { ascending: false }).limit(20));

      // --- 3. EXACT HOOK SIMULATION ---
      const hookStart = performance.now();
      const hookQuery = supabase
        .from('delivery_orders')
        .select('*', { count: 'exact' }) 
        .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'in_transit', 'arrived_at_customer'])
        .or('is_deleted.eq.false,is_deleted.is.null');
      
      const hookRes = await executeLoggedQuery('Hook Query Simulation', "SELECT * FROM delivery_orders WHERE status IN (...) AND (is_deleted = false OR is_deleted IS NULL)", hookQuery);
      const hookEnd = performance.now();

      const [
        resOrdTotal, resOrdDelivery, resOrdDelTrue, resOrdDelFalse, resOrdDelNull, resOrdLast20,
        resDelOrdTotal, resDelOrdActive, resDelOrdDelTrue, resDelOrdLast20
      ] = await Promise.all([
        pOrdersTotal, pOrdersDelivery, pOrdersDelTrue, pOrdersDelFalse, pOrdersDelNull, pOrdersLast20,
        pDelOrdTotal, pDelOrdActive, pDelOrdDelTrue, pDelOrdLast20
      ]);

      setOrdersData({
        total: resOrdTotal.count || 0,
        deliveryType: resOrdDelivery.count || 0,
        deletedTrue: resOrdDelTrue.count || 0,
        deletedFalse: resOrdDelFalse.count || 0,
        deletedNull: resOrdDelNull.count || 0,
        last20: resOrdLast20.data || []
      });

      setDeliveryOrdersData({
        total: resDelOrdTotal.count || 0,
        activeStatuses: resDelOrdActive.count || 0,
        deletedTrue: resDelOrdDelTrue.count || 0,
        last20: resDelOrdLast20.data || []
      });

      setHookAnalysis({
        exactQueryResponse: hookRes.data,
        count: hookRes.count || 0,
        error: hookRes.error,
        executionTime: (hookEnd - hookStart).toFixed(2)
      });

      toast({
        title: "Diagnostics Terminés",
        description: "Regardez la console (F12) pour l'analyse d'intégrité complète.",
      });

    } catch (error) {
      console.error("Diagnostic error:", error);
      toast({
        variant: "destructive",
        title: "Erreur de Diagnostic",
        description: error.message || "Une erreur est survenue lors des requêtes.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const copyToClipboard = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast({ title: "Copié dans le presse-papiers" });
  };

  const renderIsDeletedBadge = (val) => {
    if (val === true) return <Badge variant="destructive">TRUE</Badge>;
    if (val === false) return <Badge variant="success" className="bg-amber-100 text-amber-800">FALSE</Badge>;
    if (val === null) return <Badge variant="secondary">NULL</Badge>;
    return <Badge variant="outline">{String(val)}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900">
              <Activity className="h-8 w-8 text-indigo-600" /> Diagnostics Delivery Orders
            </h1>
            <p className="text-gray-500 mt-1">
              Analyse approfondie des tables. <strong className="text-amber-600">Ouvrez la console du navigateur (F12) pour voir les résultats complets d'intégrité.</strong>
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={runDataIntegrityDiagnostics} variant="secondary" className="flex items-center gap-2 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100">
              <TerminalSquare className="w-4 h-4" /> Relancer Console
            </Button>
            <Button onClick={runDiagnostics} disabled={loading} className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 
              {loading ? 'Analyse...' : 'Relancer Tout'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="hook" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="hook">Hook & Badges</TabsTrigger>
            <TabsTrigger value="delivery_orders">Table: delivery_orders</TabsTrigger>
            <TabsTrigger value="orders">Table: orders</TabsTrigger>
            <TabsTrigger value="logs">Logs UI</TabsTrigger>
          </TabsList>

          {/* TAB: HOOK & BADGES */}
          <TabsContent value="hook" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50/50 pb-4">
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" /> Affichage Actuel (Badges)
                  </CardTitle>
                  <CardDescription>Valeurs retournées par le hook <code>useUnreadDeliveryOrders</code> en temps réel.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center border-b pb-4">
                    <div>
                      <p className="font-bold text-gray-800">Badge Delivery</p>
                      <p className="text-xs text-gray-500">Affiché dans la Sidebar et Topbar</p>
                    </div>
                    <div className="text-4xl font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl">
                      {hookState.deliveryUnread}
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-b pb-4">
                    <div>
                      <p className="font-bold text-gray-800">Badge Restaurant</p>
                      <p className="text-xs text-gray-500">Pour référence</p>
                    </div>
                    <div className="text-2xl font-bold text-gray-600 bg-gray-50 px-4 py-2 rounded-xl">
                      {hookState.restaurantUnread}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4 border-b">
                  <CardTitle className="flex items-center justify-between">
                    <span>Simulation Requête du Hook</span>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {hookAnalysis.executionTime}ms
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Requête exacte exécutée :<br/>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-2 whitespace-pre-wrap break-words">
                      supabase.from('delivery_orders')<br/>
                      .select('*', &#123; count: 'exact' &#125;)<br/>
                      .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'in_transit', 'arrived_at_customer'])<br/>
                      .or('is_deleted.eq.false,is_deleted.is.null')
                    </code>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold text-gray-700">Count retourné par Supabase :</span>
                    <span className="text-3xl font-bold text-indigo-600">{hookAnalysis.count}</span>
                  </div>
                  
                  {hookAnalysis.error && (
                    <div className="bg-red-50 p-3 rounded text-red-700 text-sm mb-4 border border-red-200">
                      Erreur: {hookAnalysis.error.message}
                    </div>
                  )}

                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold">Données brutes retournées ({hookAnalysis.exactQueryResponse?.length || 0} lignes)</span>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(hookAnalysis.exactQueryResponse)}>
                        <Copy className="h-4 w-4 mr-1" /> Copier JSON
                      </Button>
                    </div>
                    <div className="bg-slate-900 text-green-400 p-4 rounded-xl overflow-auto max-h-64 text-xs font-mono">
                      {JSON.stringify(hookAnalysis.exactQueryResponse, null, 2)}
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* TAB: DELIVERY_ORDERS */}
          <TabsContent value="delivery_orders">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-sm text-gray-500">Total Lignes</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{deliveryOrdersData.total}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-sm text-gray-500">Statuts Actifs</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold text-blue-600">{deliveryOrdersData.activeStatuses}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-sm text-gray-500">is_deleted = true</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold text-red-600">{deliveryOrdersData.deletedTrue}</p></CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>20 dernières lignes (delivery_orders)</CardTitle>
                  <CardDescription>Vue directe de la base de données, triée par created_at DESC</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(deliveryOrdersData.last20)}>Copier JSON</Button>
              </CardHeader>
              <CardContent className="p-0 overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3">is_deleted</th>
                      <th className="px-4 py-3">Date création</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryOrdersData.last20.map(row => (
                      <tr key={row.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-xs">{row.id.substring(0,8)}...</td>
                        <td className="px-4 py-2"><Badge variant="outline">{row.status}</Badge></td>
                        <td className="px-4 py-2">{renderIsDeletedBadge(row.is_deleted)}</td>
                        <td className="px-4 py-2 text-gray-500">{new Date(row.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: ORDERS */}
          <TabsContent value="orders">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-xs text-gray-500">Total Lignes</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{ordersData.total}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-xs text-gray-500">type = delivery</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold text-blue-600">{ordersData.deliveryType}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-xs text-gray-500">is_deleted = true</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold text-red-600">{ordersData.deletedTrue}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-xs text-gray-500">is_deleted = false</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold text-amber-600">{ordersData.deletedFalse}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-xs text-gray-500">is_deleted IS NULL</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold text-yellow-600">{ordersData.deletedNull}</p></CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>20 dernières lignes (orders)</CardTitle>
                  <CardDescription>Table principale des commandes</CardDescription>
                </div>
                 <Button variant="outline" size="sm" onClick={() => copyToClipboard(ordersData.last20)}>Copier JSON</Button>
              </CardHeader>
              <CardContent className="p-0 overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3">is_deleted</th>
                      <th className="px-4 py-3">Date création</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersData.last20.map(row => (
                      <tr key={row.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-xs">{row.id.substring(0,8)}...</td>
                        <td className="px-4 py-2"><Badge variant="secondary">{row.type}</Badge></td>
                        <td className="px-4 py-2"><Badge variant="outline">{row.status}</Badge></td>
                        <td className="px-4 py-2">{renderIsDeletedBadge(row.is_deleted)}</td>
                        <td className="px-4 py-2 text-gray-500">{new Date(row.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: LOGS */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Logs d'Exécution des Requêtes</CardTitle>
                <CardDescription>Détail de toutes les requêtes effectuées lors de ce diagnostic</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">Heure</th>
                        <th className="px-4 py-3">Nom de l'opération</th>
                        <th className="px-4 py-3">Requête / Filtres</th>
                        <th className="px-4 py-3">Temps (ms)</th>
                        <th className="px-4 py-3">Statut</th>
                        <th className="px-4 py-3">Résultat (Count/Lignes)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {queryLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit', fractionalSecondDigits: 3 })}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{log.name}</td>
                          <td className="px-4 py-3 font-mono text-[10px] text-gray-600 max-w-xs truncate" title={log.requestDetails}>
                            {log.requestDetails}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">{log.duration}</td>
                          <td className="px-4 py-3">
                            {log.status === 'success' 
                              ? <Badge variant="success" className="bg-amber-100 text-amber-800">Succès</Badge>
                              : <Badge variant="destructive">Erreur</Badge>
                            }
                          </td>
                          <td className="px-4 py-3 text-xs">
                             {log.status === 'success' 
                                ? `Count: ${log.responseData.count ?? 'N/A'}, Lignes: ${log.responseData.data?.length ?? 'N/A'}`
                                : <span className="text-red-500 truncate block max-w-[150px]">{log.responseData.error?.message || 'Erreur'}</span>
                             }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {queryLogs.length === 0 && (
                    <div className="p-8 text-center text-gray-500">Aucun log disponible. Lancez un diagnostic.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminDiagnosticDeliveryOrdersPage;