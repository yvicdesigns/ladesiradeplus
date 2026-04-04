import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldCheck, RefreshCw, Loader2, ShieldX, Database, Lock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

export const AdminRLSDiagnosticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('audit_rls_configuration');
      if (error) throw error;
      setReport(data);
    } catch (err) {
      console.error("Error fetching RLS diagnostics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  return (
    <AdminLayout>
      <Helmet>
        <title>RLS Configuration - Administration</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-blue-600" /> Diagnostics RLS
            </h1>
            <p className="text-muted-foreground mt-1">Analyse complète des politiques Row Level Security sur vos tables.</p>
          </div>
          <Button onClick={fetchDiagnostics} disabled={loading} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Rafraîchir
          </Button>
        </div>

        {loading && !report ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : report ? (
          <>
            <Card className="border-2">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-xl">Score de Sécurité Global</CardTitle>
                <CardDescription>Évaluation de la couverture RLS sur les tables cibles</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-4xl font-black text-blue-600">{report.security_score}%</span>
                    <span className="text-sm font-medium text-gray-500">{report.tables?.filter(t => t.rls_enabled).length} / {report.tables?.length} tables sécurisées</span>
                  </div>
                  <Progress value={report.security_score} className="h-4" indicatorColor={report.security_score === 100 ? 'bg-amber-500' : report.security_score > 50 ? 'bg-amber-500' : 'bg-red-500'} />
                  
                  {report.security_score < 100 && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Attention</AlertTitle>
                      <AlertDescription>
                        Certaines tables ne sont pas entièrement protégées par RLS ou manquent de politiques explicites.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              {report.tables?.map((table, idx) => (
                <Card key={idx} className={`border-t-4 shadow-sm ${table.rls_enabled ? 'border-t-green-500' : 'border-t-red-500'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Database className="h-5 w-5 text-gray-400" />
                        {table.table_name}
                      </CardTitle>
                      {table.rls_enabled ? (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Lock className="w-3 h-3 mr-1"/> RLS Actif</Badge>
                      ) : (
                        <Badge variant="destructive"><ShieldX className="w-3 h-3 mr-1"/> RLS Inactif</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Politiques actives :</span>
                      <span className="font-bold">{table.policy_count}</span>
                    </div>

                    <div className="space-y-2">
                      {table.policies?.map((pol, pIdx) => (
                        <div key={pIdx} className="bg-gray-50 rounded p-3 text-xs border border-gray-100">
                          <div className="font-bold text-blue-700 mb-1">{pol.policyname}</div>
                          <div className="grid grid-cols-3 gap-1 mb-1">
                            <span className="col-span-1 text-gray-500">Action:</span>
                            <span className="col-span-2 font-mono bg-blue-50 px-1 rounded">{pol.cmd}</span>
                          </div>
                          {pol.qual && (
                            <div className="grid grid-cols-3 gap-1">
                              <span className="col-span-1 text-gray-500">USING:</span>
                              <span className="col-span-2 font-mono break-all text-amber-700">{pol.qual}</span>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {table.policy_count === 0 && table.rls_enabled && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                          <strong>Alerte :</strong> RLS est activé mais aucune politique n'est définie. La table est donc complètement verrouillée et inaccessible.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default AdminRLSDiagnosticsPage;