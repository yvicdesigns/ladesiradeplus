import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Search, CheckCircle, AlertTriangle, XCircle, Link, PlusCircle, LayoutDashboard, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

export const AdminDiagnosticUserAssignmentPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [diagnosticData, setDiagnosticData] = useState({
    profile: null,
    adminUsers: null,
    restaurants: []
  });
  const [tableDiagnostic, setTableDiagnostic] = useState(null);

  const runDiagnostic = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: adminUsers } = await supabase
        .from('admin_users')
        .select('*, restaurants(name)')
        .eq('user_id', user.id);

      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('id, name');

      setDiagnosticData({
        profile,
        adminUsers: adminUsers || [],
        restaurants: restaurants || []
      });

    } catch (error) {
      console.error("Diagnostic error:", error);
    } finally {
      setLoading(false);
    }
  };

  const runDeepTableDiagnostic = async () => {
    try {
      console.log("Running deep table diagnostic for admin_users...");
      const { data: totalRecords, error: countError } = await supabase
        .from('admin_users')
        .select('id', { count: 'exact' });
        
      const { data: targetUserRecords, error: targetError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', 'b6d4409c-d3bb-43b1-a27f-e63c64cbfa65');
        
      const summary = {
        totalRecords: totalRecords?.length || 0,
        targetUserRecords: targetUserRecords || [],
        errors: { countError, targetError }
      };
      
      console.log("Deep Diagnostic Summary:", JSON.stringify(summary, null, 2));
      setTableDiagnostic(summary);
      toast({ title: "Diagnostic terminé", description: "Les résultats sont affichés dans la console et à l'écran." });
    } catch (err) {
      console.error("Deep diagnostic failed:", err);
    }
  };

  const forceFixLaDesiadePlusAdmin = async () => {
    try {
      setLoading(true);
      const targetUserId = 'b6d4409c-d3bb-43b1-a27f-e63c64cbfa65';
      const targetRestId = '7eedf081-0268-4867-af38-61fa5932420a';
      const email = 'admin@ladesiradeplus.com';

      console.log(`Attempting to insert admin_users record for ${email}...`);

      const { error } = await supabase
        .from('admin_users')
        .insert({
          user_id: targetUserId,
          email: email,
          name: 'Admin',
          role: 'admin',
          status: 'active',
          restaurant_id: targetRestId,
          is_deleted: false,
          updated_at: new Date().toISOString()
        });

      if (error) {
        if (error.code === '23505') {
           // Unique violation, let's update instead
           console.log("Record exists, updating instead...");
           await supabase.from('admin_users')
             .update({ role: 'admin', status: 'active', is_deleted: false, restaurant_id: targetRestId })
             .eq('user_id', targetUserId);
        } else {
           throw error;
        }
      }

      await supabase.from('profiles').update({ role: 'admin' }).eq('user_id', targetUserId);

      toast({
        title: "Succès",
        description: `L'utilisateur ${email} a été assigné avec succès.`,
        className: "bg-amber-500 text-white"
      });
      
      await runDiagnostic();
    } catch (err) {
      console.error("Failed to fix La Desirade Plus Admin:", err);
      toast({
        variant: "destructive",
        title: "Erreur d'insertion",
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostic();
  }, [user]);

  if (!user) {
    return <div className="p-8 text-center">Non authentifié</div>;
  }

  const hasAdminUserRecord = diagnosticData.adminUsers && diagnosticData.adminUsers.length > 0;
  const isCorrectlyAssigned = hasAdminUserRecord && diagnosticData.adminUsers.some(a => !a.is_deleted && a.status === 'active' && a.restaurant_id);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
               <Search className="h-8 w-8 text-blue-600" /> Diagnostic d'Assignation
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Vérifiez pourquoi votre accès administrateur est bloqué ou testez les assignations.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={runDeepTableDiagnostic} variant="outline" className="gap-2">
              <Database className="h-4 w-4" /> Audit Table
            </Button>
            <Button onClick={runDiagnostic} disabled={loading} variant="outline" className="gap-2">
              <Search className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Rafraîchir
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
        ) : (
          <div className="space-y-6">
            
            {/* OVERALL STATUS */}
            {!isCorrectlyAssigned ? (
              <Alert variant="destructive" className="border-red-300 bg-red-50 text-red-900">
                <XCircle className="h-6 w-6 text-red-600" />
                <AlertTitle className="text-lg font-bold">Problème d'Assignation Détecté</AlertTitle>
                <AlertDescription className="mt-2">
                  <p className="mb-4">Votre compte n'est pas correctement lié à un restaurant dans la table <code>admin_users</code>. Le système Multi-Tenant bloque l'accès pour des raisons de sécurité.</p>
                  <div className="flex gap-3">
                    <Button onClick={() => navigate('/admin/setup-user-assignment')} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                       <Link className="h-4 w-4" /> Outil de réparation
                    </Button>
                    <Button onClick={forceFixLaDesiadePlusAdmin} variant="outline" className="gap-2 text-red-700 border-red-200">
                       <PlusCircle className="h-4 w-4" /> Forcer Admin La Desirade Plus
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-amber-300 bg-amber-50 text-amber-900">
                <div className="flex items-start justify-between">
                  <div className="flex gap-2">
                    <CheckCircle className="h-6 w-6 text-amber-600" />
                    <div>
                      <AlertTitle className="text-lg font-bold">Assignation Valide et Fonctionnelle</AlertTitle>
                      <AlertDescription className="mt-2 text-sm">
                        L'isolation tenant est confirmée. Vous êtes correctement assigné et pouvez gérer votre restaurant.
                      </AlertDescription>
                    </div>
                  </div>
                  <Button onClick={() => navigate('/admin/dashboard')} className="bg-green-600 hover:bg-green-700 text-white">
                    <LayoutDashboard className="h-4 w-4 mr-2" /> Accéder au Dashboard
                  </Button>
                </div>
              </Alert>
            )}

            {tableDiagnostic && (
               <Card className="border-blue-200 bg-blue-50/50">
                 <CardHeader className="pb-2">
                   <CardTitle className="text-md flex items-center gap-2">
                     <Database className="h-4 w-4 text-blue-600" /> Résultat Audit Table admin_users
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <pre className="text-xs bg-black text-green-400 p-4 rounded-md overflow-x-auto">
                     {JSON.stringify(tableDiagnostic, null, 2)}
                   </pre>
                 </CardContent>
               </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ADMIN_USERS TABLE */}
              <Card>
                <CardHeader className="bg-muted/30 pb-4">
                  <CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Enregistrement admin_users</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 text-sm">
                  {!hasAdminUserRecord ? (
                    <div className="text-red-600 bg-red-50 p-4 rounded-md border border-red-100">
                      <p className="font-semibold mb-1">Aucun enregistrement trouvé pour {user.email}.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {diagnosticData.adminUsers.map((adminRecord, idx) => (
                        <div key={idx} className="bg-muted p-4 rounded-md border text-sm font-mono space-y-2">
                          <div className="flex justify-between items-center mb-2 border-b pb-2">
                             <span className="font-bold text-lg">Assignation Active</span>
                             <Badge className={adminRecord.is_deleted ? "bg-red-500" : "bg-amber-500"}>
                               {adminRecord.is_deleted ? 'Supprimé' : 'Actif'}
                             </Badge>
                          </div>
                          <div className="flex justify-between border-b border-gray-200 pb-1">
                             <strong className="text-muted-foreground">User ID:</strong> 
                             <span className="break-all text-right ml-4">{adminRecord.user_id}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-200 pb-1">
                             <strong className="text-muted-foreground">Email:</strong> 
                             <span>{adminRecord.email}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-200 pb-1">
                             <strong className="text-muted-foreground">Restaurant ID:</strong> 
                             <span className="break-all text-right ml-4 font-bold text-blue-600">{adminRecord.restaurant_id}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-200 pb-1">
                             <strong className="text-muted-foreground">Rôle:</strong> 
                             <span>{adminRecord.role}</span>
                          </div>
                          <div className="flex justify-between">
                             <strong className="text-muted-foreground">Statut:</strong> 
                             <Badge variant="outline">{adminRecord.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDiagnosticUserAssignmentPage;