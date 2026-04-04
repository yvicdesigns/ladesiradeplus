import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Bug, ShieldAlert, Database, TerminalSquare, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { SINGLE_RESTAURANT_ID } from '@/lib/restaurantUtils';

export default function AdminClientDropdownDebugPage() {
  const [data, setData] = useState({
    rawCustomers: [],
    count: 0,
    rlsPolicies: null,
    dbDiagnostics: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAllTests = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Test Raw Fetch (exactly as CreateOrderModal does it)
      const { data: rawCustomers, error: fetchError, count } = await supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('restaurant_id', SINGLE_RESTAURANT_ID)
        .or('is_deleted.eq.false,is_deleted.is.null');

      if (fetchError) throw new Error(`Raw Fetch Error: ${fetchError.message}`);

      // 2. Fetch RLS Policies
      const { data: rlsData, error: rlsError } = await supabase.rpc('diagnose_customers_rls');
      
      // 3. Database DB Diags
      const { data: dbData, error: dbError } = await supabase.rpc('diagnose_customers_table');

      setData({
        rawCustomers: rawCustomers || [],
        count: count || 0,
        rlsPolicies: rlsData,
        dbDiagnostics: dbData,
        errors: { rlsError, dbError }
      });

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 pb-24">
        
        <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Bug className="w-6 h-6 text-indigo-600" />
              Diagnostic Dropdown Clients
            </h1>
            <p className="text-slate-500">Analyse de la récupération des clients pour le formulaire de commande.</p>
          </div>
          <Button onClick={runAllTests} disabled={loading} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Lancer le diagnostic
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erreur critique lors des tests</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Raw Query Results */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <TerminalSquare className="w-5 h-5 text-blue-500" />
                Résultat Requête Frontend
              </CardTitle>
              <CardDescription>Données retournées exactement comme dans CreateOrderModal</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-4">
                 <div className="flex-1 bg-blue-50 border border-blue-100 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-700">{data.rawCustomers.length}</div>
                    <div className="text-xs text-blue-600 font-medium">Clients Récupérés (Array)</div>
                 </div>
                 <div className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-slate-700">{data.count}</div>
                    <div className="text-xs text-slate-600 font-medium">Count Supabase (Exact)</div>
                 </div>
              </div>
              
              <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto text-xs font-mono text-green-400">
                {`supabase.from('customers')
  .select('*', { count: 'exact' })
  .eq('restaurant_id', '${SINGLE_RESTAURANT_ID}')
  .or('is_deleted.eq.false,is_deleted.is.null')`}
              </div>

              {data.rawCustomers.length === 0 ? (
                <div className="bg-yellow-50 text-yellow-800 p-3 rounded border border-yellow-200 flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="text-sm">La requête retourne 0 client. Si vous savez qu'il y a des clients dans la base, c'est un problème de permissions (RLS) ou le filtre <code>restaurant_id</code> ne correspond pas.</span>
                </div>
              ) : (
                <div className="bg-amber-50 text-amber-800 p-3 rounded border border-amber-200 flex gap-2">
                   <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                   <span className="text-sm">Succès. La requête frontend fonctionne. Si le dropdown est toujours vide, le problème vient du composant React.</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Database Server Diagnostics */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Database className="w-5 h-5 text-purple-500" />
                Comptage Base de Données (Bypass RLS)
              </CardTitle>
              <CardDescription>Vérification de l'existence réelle des données sur le serveur.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
               {data.dbDiagnostics ? (
                 <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-purple-700">{data.dbDiagnostics.active_count_for_restaurant}</div>
                          <div className="text-xs text-purple-600 font-medium">Actifs pour ce restaurant</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-slate-700">{data.dbDiagnostics.total_count_all}</div>
                          <div className="text-xs text-slate-600 font-medium">Total table entière</div>
                      </div>
                   </div>
                   
                   <div className="text-sm p-3 bg-slate-50 rounded border">
                      <span className="font-semibold block mb-1">Analyse:</span>
                      {data.dbDiagnostics.active_count_for_restaurant > 0 && data.rawCustomers.length === 0 ? (
                        <span className="text-red-600">❌ Les données existent en base, mais la requête frontend est bloquée ! C'est un problème de politiques RLS avec 100% de certitude.</span>
                      ) : data.dbDiagnostics.active_count_for_restaurant === 0 ? (
                        <span className="text-amber-600">⚠️ Il n'y a littéralement aucun client actif pour ce restaurant_id dans la base de données. Créez un client d'abord.</span>
                      ) : (
                        <span className="text-amber-600">✅ Les données en base correspondent aux données récupérées par le frontend. L'accès RLS fonctionne.</span>
                      )}
                   </div>
                 </div>
               ) : (
                 <div className="text-sm text-slate-500">Chargement des diagnostics DB...</div>
               )}
            </CardContent>
          </Card>

          {/* Card 3: RLS Policies */}
          <Card className="border-slate-200 shadow-sm md:col-span-2">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                Analyse des Politiques RLS (Row Level Security)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 overflow-auto max-h-96">
              {data.rlsPolicies ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Badge variant="outline">Auth UID: {data.rlsPolicies.auth_uid || 'Aucun (Non connecté)'}</Badge>
                    <Badge variant="outline">JWT Role: {data.rlsPolicies.jwt_role || 'Aucun'}</Badge>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <h4 className="font-bold text-sm text-slate-700">Politiques actives sur `public.customers`</h4>
                    {data.rlsPolicies.policies && data.rlsPolicies.policies.length > 0 ? (
                      <div className="grid gap-2">
                        {data.rlsPolicies.policies.map((p, i) => (
                          <div key={i} className="bg-slate-50 p-3 rounded-lg border text-sm">
                            <div className="font-bold text-slate-800 mb-1">{p.policyname}</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div><span className="text-slate-500">Action:</span> {p.cmd}</div>
                              <div><span className="text-slate-500">Roles:</span> {p.roles ? p.roles.join(', ') : 'All'}</div>
                              <div className="col-span-2 font-mono bg-white p-1 rounded border mt-1 overflow-x-auto">
                                <span className="text-slate-500 block mb-0.5">USING (Read):</span>
                                {p.qual || 'None'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-red-500 text-sm font-medium">⚠️ Aucune politique RLS trouvée. Si RLS est activé, toutes les requêtes seront refusées par défaut.</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">Chargement des politiques RLS...</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}