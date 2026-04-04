import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ShieldAlert, RefreshCw, Database, User, Key, Info } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

export const AdminRLSDebugPage = () => {
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState(null);
  const [policies, setPolicies] = useState([]);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      // 1. Fetch function verification
      const { data: diagData, error: diagError } = await supabase.rpc('verify_admin_settings_rls');
      if (diagError) throw diagError;
      setDiagnostics(diagData);

      // 2. Fetch policies
      const { data: polData, error: polError } = await supabase.rpc('get_table_policies', { p_table_name: 'admin_settings' });
      if (!polError) setPolicies(polData || []);

    } catch (err) {
      console.error("Diagnostic error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  return (
    <AdminLayout>
      <Helmet><title>RLS Debug - Administration</title></Helmet>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <ShieldAlert className="h-8 w-8 text-amber-600" /> RLS Debug: admin_settings
            </h1>
            <p className="text-muted-foreground mt-1">Diagnostiquez les problèmes d'accès et les politiques de sécurité.</p>
          </div>
          <Button onClick={fetchDiagnostics} disabled={loading} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Identity & Context */}
            <Card className="border-t-4 border-t-blue-500 shadow-sm">
              <CardHeader className="bg-slate-50/50 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" /> Contexte Utilisateur
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <span className="font-semibold text-gray-500">ID Utilisateur</span>
                  <span className="col-span-2 font-mono text-xs">{diagnostics?.uid || 'Non authentifié'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <span className="font-semibold text-gray-500">Email</span>
                  <span className="col-span-2">{diagnostics?.email || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <span className="font-semibold text-gray-500">Rôle (profiles)</span>
                  <span className="col-span-2">
                    <Badge variant={diagnostics?.profile_role === 'admin' ? 'default' : 'secondary'}>
                      {diagnostics?.profile_role || 'N/A'}
                    </Badge>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <span className="font-semibold text-gray-500">Rôle (admin_users)</span>
                  <span className="col-span-2">
                    <Badge variant={diagnostics?.admin_users_role === 'admin' ? 'default' : 'secondary'}>
                      {diagnostics?.admin_users_role || 'N/A'}
                    </Badge>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="font-semibold text-gray-500">is_role_admin()</span>
                  <span className="col-span-2">
                    {diagnostics?.is_role_admin_result ? (
                      <Badge className="bg-amber-500">Vrai (Autorisé)</Badge>
                    ) : (
                      <Badge variant="destructive">Faux (Bloqué)</Badge>
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Permission Resolution */}
            <Card className="border-t-4 border-t-purple-500 shadow-sm">
              <CardHeader className="bg-slate-50/50 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5 text-purple-500" /> Droits Calculés
                </CardTitle>
                <CardDescription>Permissions effectives pour admin_settings</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {diagnostics?.permissions && Object.entries(diagnostics.permissions).map(([op, allowed]) => (
                  <div key={op} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span className="font-mono text-sm font-bold text-slate-700">{op}</span>
                    {allowed ? (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200">Autorisé</Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">Refusé</Badge>
                    )}
                  </div>
                ))}

                {!diagnostics?.is_role_admin_result && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTitle>Opérations bloquées</AlertTitle>
                    <AlertDescription>{diagnostics?.reason}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Policies */}
            <Card className="md:col-span-2 border-t-4 border-t-amber-500 shadow-sm">
              <CardHeader className="bg-slate-50/50 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-amber-500" /> Politiques Actives (admin_settings)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {policies.length === 0 ? (
                  <Alert><Info className="h-4 w-4" /><AlertTitle>Aucune politique trouvée</AlertTitle><AlertDescription>La table n'est peut-être pas protégée par RLS.</AlertDescription></Alert>
                ) : (
                  <div className="space-y-3">
                    {policies.map((pol, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-800">{pol.policyname}</span>
                          <Badge variant="outline" className="bg-white">{pol.cmd}</Badge>
                        </div>
                        <div className="text-sm font-mono bg-slate-900 text-slate-300 p-2 rounded break-all mt-2">
                          <span className="text-purple-400">USING</span> ({pol.qual || 'true'})
                          {pol.with_check && <><br /><span className="text-purple-400">WITH CHECK</span> ({pol.with_check})</>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRLSDebugPage;