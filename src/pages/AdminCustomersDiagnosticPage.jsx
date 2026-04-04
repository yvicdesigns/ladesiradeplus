import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { RefreshCw, Database, AlertCircle, CheckCircle2, Users, Info } from 'lucide-react';
import { getRestaurantIdWithFallback } from '@/lib/restaurantUtils';

export default function AdminCustomersDiagnosticPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentAdminRestaurantId, setCurrentAdminRestaurantId] = useState(null);

  const TARGET_ID_1 = '7eedf081-0268-4867-af38-61fa5932420a';
  const TARGET_ID_2 = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get the current context ID to show what the admin is authenticated as
      const myId = await getRestaurantIdWithFallback();
      setCurrentAdminRestaurantId(myId);

      // Attempt to fetch ALL customers bypassing filters to see raw DB content (subject to RLS)
      const { data: customers, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const safeCustomers = customers || [];

      // Process stats
      const total = safeCustomers.length;
      const byRestaurant = safeCustomers.reduce((acc, curr) => {
        const id = curr.restaurant_id || 'NULL/UNDEFINED';
        if (!acc[id]) acc[id] = { count: 0, active: 0, deleted: 0 };
        acc[id].count++;
        if (curr.is_deleted) acc[id].deleted++;
        else acc[id].active++;
        return acc;
      }, {});

      const target1Data = safeCustomers.filter(c => c.restaurant_id === TARGET_ID_1);
      const target2Data = safeCustomers.filter(c => c.restaurant_id === TARGET_ID_2);

      setData({
        total,
        byRestaurant,
        target1Data,
        target2Data,
        allCustomers: safeCustomers,
        sample: safeCustomers.slice(0, 10)
      });
    } catch (err) {
      console.error('Diagnostic fetch error:', err);
      setError(err.message || 'An error occurred fetching diagnostic data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-5 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Diagnostic Table Customers</h1>
              <p className="text-sm text-gray-500">Analyse brute de la base de données clients</p>
            </div>
          </div>
          <Button onClick={fetchData} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-50">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Erreur de diagnostic</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Alert className="bg-slate-50 border-slate-200">
          <Info className="h-5 w-5 text-slate-600" />
          <AlertTitle className="text-slate-800 font-bold">Contexte d'exécution</AlertTitle>
          <AlertDescription className="mt-2 text-slate-700 font-mono text-sm">
            Restaurant ID actuel de l'administrateur : <strong className="text-blue-600">{currentAdminRestaurantId || 'Chargement...'}</strong>
            <br />
            <span className="text-xs text-gray-500 mt-1 block">Note: Les résultats affichés dépendent des règles de sécurité (RLS) appliquées à votre compte.</span>
          </AlertDescription>
        </Alert>

        {loading && !data ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : data ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                  <Users className="h-8 w-8 text-indigo-500 mb-2" />
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Clients Visibles</p>
                  <h2 className="text-4xl font-bold text-gray-900 mt-1">{data.total}</h2>
                </CardContent>
              </Card>

              <Card className={`border-2 ${data.target1Data.length > 0 ? 'border-amber-200 bg-amber-50' : 'border-gray-200'}`}>
                <CardContent className="p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Cible 1</p>
                  <p className="text-[10px] font-mono text-gray-600 break-all mb-2">{TARGET_ID_1}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{data.target1Data.length}</span>
                    <span className="text-sm text-gray-600">clients trouvés</span>
                    {data.target1Data.length > 0 && <CheckCircle2 className="h-5 w-5 text-amber-600 ml-auto" />}
                  </div>
                </CardContent>
              </Card>

              <Card className={`border-2 ${data.target2Data.length > 0 ? 'border-amber-200 bg-amber-50' : 'border-gray-200'}`}>
                <CardContent className="p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Cible 2 (Défaut)</p>
                  <p className="text-[10px] font-mono text-gray-600 break-all mb-2">{TARGET_ID_2}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{data.target2Data.length}</span>
                    <span className="text-sm text-gray-600">clients trouvés</span>
                    {data.target2Data.length > 0 && <CheckCircle2 className="h-5 w-5 text-amber-600 ml-auto" />}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Breakdown by Restaurant ID */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Répartition par Restaurant ID</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Restaurant ID</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Actifs</TableHead>
                        <TableHead className="text-center">Supprimés</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(data.byRestaurant).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-500 py-4">Aucune donnée trouvée</TableCell>
                        </TableRow>
                      ) : (
                        Object.entries(data.byRestaurant).map(([id, stats]) => (
                          <TableRow key={id} className={id === currentAdminRestaurantId ? 'bg-blue-50/50' : ''}>
                            <TableCell className="font-mono text-xs">
                              {id}
                              {id === currentAdminRestaurantId && <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">Actuel</Badge>}
                            </TableCell>
                            <TableCell className="text-center font-bold">{stats.count}</TableCell>
                            <TableCell className="text-center text-amber-600">{stats.active}</TableCell>
                            <TableCell className="text-center text-red-600">{stats.deleted}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Sample Data */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Échantillon de données (10 premiers)</CardTitle>
                <Badge variant="outline">{data.sample.length} affichés</Badge>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="whitespace-nowrap">ID Client</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="whitespace-nowrap">Restaurant ID</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Création</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.sample.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            La table est vide ou inaccessible (RLS).
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.sample.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell className="font-mono text-[10px] text-gray-500 max-w-[100px] truncate" title={client.id}>
                              {client.id}
                            </TableCell>
                            <TableCell className="font-medium">{client.name || <span className="italic text-gray-400">Vide</span>}</TableCell>
                            <TableCell>
                              <div className="text-xs">{client.email || '-'}</div>
                              <div className="text-xs text-gray-500">{client.phone || '-'}</div>
                            </TableCell>
                            <TableCell className="font-mono text-[10px] text-indigo-600 max-w-[120px] truncate" title={client.restaurant_id}>
                              {client.restaurant_id}
                            </TableCell>
                            <TableCell>
                              {client.is_deleted ? (
                                <Badge variant="destructive" className="text-[10px]">Supprimé</Badge>
                              ) : (
                                <Badge variant="default" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0 text-[10px]">Actif</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-gray-500">
                              {new Date(client.created_at).toLocaleDateString('fr-FR')}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}