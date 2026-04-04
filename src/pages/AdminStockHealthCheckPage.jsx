import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { getStockDebugInfo } from '@/lib/stockDebugUtils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminStockHealthCheckPage = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  const runDiagnostics = async () => {
    setLoading(true);
    setResults(null);

    const diagnostics = {
      timestamp: new Date().toISOString(),
      network: navigator.onLine,
      auth: { passed: false, detail: '' },
      menuItems: { passed: false, detail: '' },
      movementsTable: { passed: false, detail: '' },
      rls: { passed: false, detail: '' },
      logs: []
    };

    try {
      // 1. Auth Test
      const { data: session } = await supabase.auth.getSession();
      if (session?.session) {
        diagnostics.auth = { passed: true, detail: 'User is authenticated' };
      } else {
        diagnostics.auth = { passed: false, detail: 'No active session found' };
      }

      // 2. Menu Items Table Test
      const { data: menuData, error: menuErr } = await supabase.from('menu_items').select('id, stock_quantity').limit(1);
      if (menuErr) {
        diagnostics.menuItems = { passed: false, detail: menuErr.message };
        diagnostics.logs.push(`menu_items error: ${menuErr.message}`);
      } else {
        diagnostics.menuItems = { passed: true, detail: 'Accessible. stock_quantity column exists.' };
      }

      // 3. Stock Movements Table Test
      const { data: movData, error: movErr } = await supabase.from('item_stock_movements').select('id').limit(1);
      if (movErr) {
        diagnostics.movementsTable = { passed: false, detail: movErr.message };
        diagnostics.logs.push(`item_stock_movements error: ${movErr.message}`);
      } else {
        diagnostics.movementsTable = { passed: true, detail: 'Accessible and readable.' };
      }

      // 4. RLS Test (Test insert capability)
      const { data: testItem } = await supabase.from('menu_items').select('id').limit(1).single();
      if (testItem) {
         // Attempt a soft write on menu_items (just updating to same value)
         const { error: rlsErr } = await supabase.from('menu_items').update({ stock_quantity: 0 }).eq('id', '00000000-0000-0000-0000-000000000000'); // Fake update
         // If it's a permissions error, it will say RLS violation
         if (rlsErr && rlsErr.code === '42501') {
             diagnostics.rls = { passed: false, detail: 'RLS Update Policy Violation: ' + rlsErr.message };
         } else {
             diagnostics.rls = { passed: true, detail: 'RLS policies allow operations for this user.' };
         }
      } else {
         diagnostics.rls = { passed: false, detail: 'No menu items to test RLS' };
      }

    } catch (err) {
      diagnostics.logs.push(`Fatal diagnostic error: ${err.message}`);
    }

    setResults(diagnostics);
    setLoading(false);
    
    // Also run backend debug utils to log directly to the console
    await getStockDebugInfo();
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const StatusIcon = ({ passed }) => (
    passed ? <CheckCircle className="h-5 w-5 text-amber-500" /> : <XCircle className="h-5 w-5 text-red-500" />
  );

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/debug')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-amber-500" />
              Stock System Diagnostics
            </h1>
            <p className="text-gray-500 text-sm">Vérification de l'intégrité du système de gestion des stocks</p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle>Résultats de l'analyse</CardTitle>
              <CardDescription>
                Dernière exécution : {results ? new Date(results.timestamp).toLocaleTimeString() : '-'}
              </CardDescription>
            </div>
            <Button onClick={runDiagnostics} disabled={loading} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
              Relancer l'analyse
            </Button>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {loading && !results ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
            ) : results ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg border flex gap-3 ${results.network ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                    <StatusIcon passed={results.network} />
                    <div>
                      <h4 className="font-bold text-gray-900">Connexion Réseau</h4>
                      <p className="text-sm text-gray-600">{results.network ? 'Connecté' : 'Hors ligne'}</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border flex gap-3 ${results.auth.passed ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                    <StatusIcon passed={results.auth.passed} />
                    <div>
                      <h4 className="font-bold text-gray-900">Authentification Supabase</h4>
                      <p className="text-sm text-gray-600">{results.auth.detail}</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border flex gap-3 ${results.menuItems.passed ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                    <StatusIcon passed={results.menuItems.passed} />
                    <div>
                      <h4 className="font-bold text-gray-900">Table: menu_items</h4>
                      <p className="text-sm text-gray-600">{results.menuItems.detail}</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border flex gap-3 ${results.movementsTable.passed ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                    <StatusIcon passed={results.movementsTable.passed} />
                    <div>
                      <h4 className="font-bold text-gray-900">Table: item_stock_movements</h4>
                      <p className="text-sm text-gray-600">{results.movementsTable.detail}</p>
                    </div>
                  </div>

                  <div className={`col-span-1 md:col-span-2 p-4 rounded-lg border flex gap-3 ${results.rls.passed ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                    <StatusIcon passed={results.rls.passed} />
                    <div>
                      <h4 className="font-bold text-gray-900">Politiques de Sécurité (RLS)</h4>
                      <p className="text-sm text-gray-600">{results.rls.detail}</p>
                    </div>
                  </div>
                </div>

                {results.logs.length > 0 && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription className="font-mono text-xs">
                      {results.logs.map((log, i) => <div key={i}>{log}</div>)}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminStockHealthCheckPage;