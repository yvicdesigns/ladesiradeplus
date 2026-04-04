import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Play, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { handleRLSError } from '@/lib/rlsErrorHandler';

export const AdminRLSTestPage = () => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState([]);

  const testTablePermissions = async (tableName) => {
    const results = {
      table: tableName,
      select: { success: false, msg: '' },
      insert: { success: false, msg: '' },
      update: { success: false, msg: '' },
      delete: { success: false, msg: '' }
    };

    // SELECT
    try {
      const { error } = await supabase.from(tableName).select('id').limit(1);
      if (error) throw error;
      results.select = { success: true, msg: 'Autorisé' };
    } catch (e) {
      const err = handleRLSError(e, 'SELECT', tableName);
      results.select = { success: !err.isRLSError, msg: err.message };
    }

    // UPDATE (Dummy)
    try {
      const { error } = await supabase.from(tableName).update({ id: '00000000-0000-0000-0000-000000000000' }).eq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      results.update = { success: true, msg: 'Autorisé' };
    } catch (e) {
      const err = handleRLSError(e, 'UPDATE', tableName);
      results.update = { success: !err.isRLSError, msg: err.message };
    }

    // DELETE (Dummy)
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      results.delete = { success: true, msg: 'Autorisé' };
    } catch (e) {
      const err = handleRLSError(e, 'DELETE', tableName);
      results.delete = { success: !err.isRLSError, msg: err.message };
    }

    return results;
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);

    const tablesToTest = ['admin_settings', 'orders', 'order_items', 'profiles', 'menu_items'];
    const newResults = [];

    for (const table of tablesToTest) {
      const res = await testTablePermissions(table);
      newResults.push(res);
      setResults([...newResults]); // Update UI progressively
    }

    setIsRunning(false);
  };

  const getScore = () => {
    if (results.length === 0) return 0;
    let total = results.length * 3; // 3 tests per table (Select, Update, Delete)
    let passed = 0;
    results.forEach(r => {
      if (r.select.success) passed++;
      if (r.update.success) passed++;
      if (r.delete.success) passed++;
    });
    return Math.round((passed / total) * 100);
  };

  return (
    <AdminLayout>
      <Helmet><title>Tests Exhaustifs RLS - Administration</title></Helmet>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <ShieldAlert className="h-8 w-8 text-amber-600" /> Tests de Permissions
            </h1>
            <p className="text-muted-foreground mt-1">Exécutez des requêtes réelles pour valider vos accès sur les tables protégées.</p>
          </div>
          <Button onClick={runAllTests} disabled={isRunning} className="gap-2">
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isRunning ? 'Tests en cours...' : 'Exécuter tous les tests'}
          </Button>
        </div>

        {results.length > 0 && !isRunning && (
          <Alert className={`border-l-4 ${getScore() === 100 ? 'border-l-green-500 bg-amber-50' : 'border-l-amber-500 bg-amber-50'}`}>
            <AlertTitle className="font-bold">Audit Terminé: Score d'accès {getScore()}%</AlertTitle>
            <AlertDescription>
              {getScore() === 100 
                ? "Excellent. Vos accès administrateur sont pleinement fonctionnels sur toutes les tables testées."
                : "Attention. Certaines permissions sont bloquées par RLS. Vérifiez les politiques."}
            </AlertDescription>
          </Alert>
        )}

        <div className="overflow-x-auto bg-white rounded-xl shadow border">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4">Table</th>
                <th className="px-6 py-4">Lecture (SELECT)</th>
                <th className="px-6 py-4">Modification (UPDATE)</th>
                <th className="px-6 py-4">Suppression (DELETE)</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 && !isRunning && (
                <tr><td colSpan="4" className="text-center py-8 text-gray-500 italic">Aucun test exécuté.</td></tr>
              )}
              {results.map((res, idx) => (
                <tr key={idx} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold font-mono">{res.table}</td>
                  
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {res.select.success ? <Badge className="w-fit bg-amber-500"><CheckCircle2 className="w-3 h-3 mr-1"/> OK</Badge> : <Badge variant="destructive" className="w-fit"><XCircle className="w-3 h-3 mr-1"/> Bloqué</Badge>}
                      {!res.select.success && <span className="text-[10px] text-red-500">{res.select.msg}</span>}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {res.update.success ? <Badge className="w-fit bg-amber-500"><CheckCircle2 className="w-3 h-3 mr-1"/> OK</Badge> : <Badge variant="destructive" className="w-fit"><XCircle className="w-3 h-3 mr-1"/> Bloqué</Badge>}
                      {!res.update.success && <span className="text-[10px] text-red-500">{res.update.msg}</span>}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {res.delete.success ? <Badge className="w-fit bg-amber-500"><CheckCircle2 className="w-3 h-3 mr-1"/> OK</Badge> : <Badge variant="destructive" className="w-fit"><XCircle className="w-3 h-3 mr-1"/> Bloqué</Badge>}
                      {!res.delete.success && <span className="text-[10px] text-red-500">{res.delete.msg}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRLSTestPage;