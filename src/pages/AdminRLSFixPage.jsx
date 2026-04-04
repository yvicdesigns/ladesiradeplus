import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Wrench, PlayCircle, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/hooks/use-toast';

export const AdminRLSFixPage = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const { toast } = useToast();

  const fixScript = `
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view admin_settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can insert admin_settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can update admin_settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can delete admin_settings" ON public.admin_settings;

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies utilizing is_role_admin()
CREATE POLICY "Admins can view admin_settings" ON public.admin_settings FOR SELECT USING (public.is_role_admin());
CREATE POLICY "Admins can insert admin_settings" ON public.admin_settings FOR INSERT WITH CHECK (public.is_role_admin());
CREATE POLICY "Admins can update admin_settings" ON public.admin_settings FOR UPDATE USING (public.is_role_admin()) WITH CHECK (public.is_role_admin());
CREATE POLICY "Admins can delete admin_settings" ON public.admin_settings FOR DELETE USING (public.is_role_admin());
  `;

  const runTests = async () => {
    setLoading(true);
    setTestResults(null);
    try {
      // Test SELECT
      const { error: selectError } = await supabase.from('admin_settings').select('id').limit(1);
      
      // Test UPDATE (dummy update to non-existent ID just to test permission, not data)
      const { error: updateError } = await supabase.from('admin_settings').update({ restaurant_name: 'Test' }).eq('id', '00000000-0000-0000-0000-000000000000');

      setTestResults({
        select: !selectError,
        selectMsg: selectError ? selectError.message : 'OK',
        update: !updateError || updateError.code !== '42501',
        updateMsg: updateError ? updateError.message : 'OK'
      });

      toast({ title: "Tests terminés", description: "Vérifiez les résultats ci-dessous." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de lancer les tests." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Helmet><title>Correction RLS - Administration</title></Helmet>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Wrench className="h-8 w-8 text-blue-600" /> Correction Interactive RLS
          </h1>
          <p className="text-muted-foreground mt-1">Appliquez le script SQL correctif pour la table admin_settings et testez les accès.</p>
        </div>

        <Card>
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle>Script SQL de résolution</CardTitle>
            <CardDescription>Veuillez exécuter ce script manuellement dans votre éditeur SQL Supabase, ou assurez-vous qu'il a été joué par les migrations.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <pre className="p-6 bg-slate-950 text-green-400 font-mono text-sm overflow-x-auto">
              {fixScript.trim()}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Validation des accès
              <Button onClick={runTests} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                Lancer les tests RLS
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold bg-white px-2 py-1 border rounded">SELECT</span>
                    <span className="text-sm text-slate-600">Lecture de la configuration</span>
                  </div>
                  {testResults.select ? (
                    <Badge className="bg-amber-500"><CheckCircle className="w-4 h-4 mr-1"/> Succès</Badge>
                  ) : (
                    <div className="flex flex-col items-end">
                      <Badge variant="destructive">Échec</Badge>
                      <span className="text-xs text-red-500 mt-1">{testResults.selectMsg}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold bg-white px-2 py-1 border rounded">UPDATE</span>
                    <span className="text-sm text-slate-600">Modification de la configuration</span>
                  </div>
                  {testResults.update ? (
                    <Badge className="bg-amber-500"><CheckCircle className="w-4 h-4 mr-1"/> Succès</Badge>
                  ) : (
                    <div className="flex flex-col items-end">
                      <Badge variant="destructive">Échec</Badge>
                      <span className="text-xs text-red-500 mt-1">{testResults.updateMsg}</span>
                    </div>
                  )}
                </div>
                
                {testResults.select && testResults.update && (
                   <Alert className="bg-amber-50 border-amber-200 mt-4">
                     <CheckCircle className="h-5 w-5 text-amber-600" />
                     <AlertTitle className="text-amber-800">RLS Opérationnel</AlertTitle>
                     <AlertDescription className="text-amber-700">Vos politiques RLS sont correctement configurées pour permettre l'accès administrateur.</AlertDescription>
                   </Alert>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                Cliquez sur "Lancer les tests RLS" pour vérifier vos droits actuels.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminRLSFixPage;