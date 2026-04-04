import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';
import { Database, AlertCircle, CheckCircle, Search, RefreshCw, Trash, HardDrive } from 'lucide-react';
import { clearAllAppCache } from '@/lib/cacheUtils';
import { useToast } from '@/hooks/use-toast';

const AdminDeliveryOrdersDebugPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  // Diagnostics state
  const [stats, setStats] = useState({
    total: 0,
    notDeleted: 0,
    deleted: 0,
    active: 0
  });
  
  const [rawRecords, setRawRecords] = useState([]);

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 [DEBUG] Fetching comprehensive delivery_orders diagnostics...');

      // 1. Total Count
      const { count: totalCount, error: err1 } = await supabase
        .from('delivery_orders')
        .select('*', { count: 'exact', head: true });
      if (err1) throw err1;

      // 2. Not Deleted Count
      const { count: notDeletedCount, error: err2 } = await supabase
        .from('delivery_orders')
        .select('*', { count: 'exact', head: true })
        .neq('is_deleted', true);
      if (err2) throw err2;

      // 3. Deleted Count
      const { count: deletedCount, error: err3 } = await supabase
        .from('delivery_orders')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', true);
      if (err3) throw err3;

      // 4. Active Status Count
      const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'in_transit', 'arrived_at_customer'];
      const { count: activeCount, error: err4 } = await supabase
        .from('delivery_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', activeStatuses)
        .neq('is_deleted', true);
      if (err4) throw err4;

      setStats({
        total: totalCount || 0,
        notDeleted: notDeletedCount || 0,
        deleted: deletedCount || 0,
        active: activeCount || 0
      });

      // 5. Raw Data of first 10 records (sorted by creation desc to see latest)
      const { data: rawData, error: err5 } = await supabase
        .from('delivery_orders')
        .select('id, status, is_deleted, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (err5) throw err5;
      setRawRecords(rawData || []);

      console.log('✅ [DEBUG] Diagnostics complete.', { stats, rawData });
    } catch (err) {
      console.error('❌ [DEBUG] Error fetching diagnostics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    try {
      clearAllAppCache();
      localStorage.clear(); // Brute force clear for thoroughness during debug
      toast({
        title: "Cache vidé",
        description: "Le cache local a été entièrement vidé. La page va se recharger.",
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Failed to clear cache", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de vider le cache.",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900">
              <HardDrive className="h-8 w-8 text-indigo-600" /> Diagnostics Badge & Commandes
            </h1>
            <p className="text-gray-500 mt-1">Analyse approfondie des requêtes de compteurs (problème du "6" au lieu de "0")</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleClearCache} variant="destructive" className="flex items-center gap-2">
              <Trash className="w-4 h-4" /> Vider le Cache
            </Button>
            <Button onClick={fetchDiagnostics} disabled={loading} className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Rafraîchir
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur d'analyse</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Total Records (delivery_orders)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gray-900">{loading ? '-' : stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">Aucun filtre appliqué</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Non Supprimés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">{loading ? '-' : stats.notDeleted}</div>
              <p className="text-xs text-gray-500 mt-1">WHERE is_deleted != true</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Supprimés (Soft Delete)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-600">{loading ? '-' : stats.deleted}</div>
              <p className="text-xs text-gray-500 mt-1">WHERE is_deleted = true</p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-700 font-bold">Valeur attendue du Badge</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-amber-700">{loading ? '-' : stats.active}</div>
              <p className="text-xs text-amber-600 mt-1">Statut actif ET is_deleted != true</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" /> Données Brutes (10 dernières commandes)
            </CardTitle>
            <CardDescription>Vérifiez l'état exact des colonnes `status` et `is_deleted` dans la base de données.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-500 animate-pulse">Chargement des données brutes...</div>
            ) : rawRecords.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Aucune donnée trouvée dans la table delivery_orders.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3">ID Commande</th>
                      <th className="px-6 py-3">Statut</th>
                      <th className="px-6 py-3">is_deleted</th>
                      <th className="px-6 py-3">Date de Création</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawRecords.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-xs">{record.id}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="font-mono">{record.status || 'NULL'}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          {record.is_deleted === true ? (
                             <Badge variant="destructive">TRUE</Badge>
                          ) : record.is_deleted === false ? (
                             <Badge variant="success" className="bg-amber-100 text-amber-800">FALSE</Badge>
                          ) : (
                             <Badge variant="secondary">NULL / NON DÉFINI</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(record.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="p-4 bg-slate-900 text-green-400 font-mono text-xs overflow-x-auto rounded-b-xl">
              <h4 className="text-slate-400 mb-2 border-b border-slate-700 pb-2">JSON Brut:</h4>
              <pre>{JSON.stringify(rawRecords, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDeliveryOrdersDebugPage;