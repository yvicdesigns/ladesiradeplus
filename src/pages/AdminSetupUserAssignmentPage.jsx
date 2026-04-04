import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { assignAdminUser } from '@/lib/adminAssignmentUtils';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, UserPlus, Server, ShieldCheck, HelpCircle, Activity, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminSetupUserAssignmentPage = () => {
  const [email, setEmail] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Diagnostic State
  const [runningDiagnostic, setRunningDiagnostic] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const { data, error } = await supabase.from('restaurants').select('id, name');
        if (error) throw error;
        setRestaurants(data || []);
      } catch (err) {
        console.error("Failed to fetch restaurants:", err);
        toast({ title: "Erreur", description: "Impossible de charger les restaurants", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, [toast]);

  const testRlsPolicies = async () => {
    setRunningDiagnostic(true);
    setDiagnosticResult(null);
    try {
      const { data, error } = await supabase.rpc('diagnose_admin_users_rls');
      
      if (error) {
        throw error;
      }
      
      setDiagnosticResult({
        success: true,
        data: data
      });
      
      if (!data.can_insert_theoretically) {
        toast({
          title: "Avertissement de sécurité",
          description: "D'après l'analyse, votre compte n'a pas les droits théoriques pour insérer des administrateurs.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Diagnostic réussi",
          description: "Vos permissions RLS semblent correctes.",
          className: "bg-amber-500 text-white"
        });
      }
      
    } catch (err) {
      console.error("Diagnostic failed:", err);
      setDiagnosticResult({
        success: false,
        error: err.message
      });
      toast({
        title: "Erreur de diagnostic",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setRunningDiagnostic(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!email || !selectedRestaurant) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const result = await assignAdminUser(email, selectedRestaurant);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: result.message,
          className: "bg-amber-500 text-white"
        });
        setEmail('');
      } else {
        // Detailed RLS Error handling
        toast({
          title: result.details?.code === '42501' ? "Accès Refusé (RLS)" : "Échec de l'assignation",
          description: result.message,
          variant: "destructive",
          duration: 6000
        });
      }
    } catch (err) {
      toast({
        title: "Erreur inattendue",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
               <ShieldCheck className="h-8 w-8 text-indigo-600" /> Réparation d'Assignation RLS
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Forcer la liaison entre un compte utilisateur et un restaurant dans <code className="bg-muted px-1 rounded">admin_users</code>.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={testRlsPolicies} 
            disabled={runningDiagnostic}
            className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            {runningDiagnostic ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
            Tester les Permissions RLS
          </Button>
        </div>

        {diagnosticResult && (
          <Alert className={diagnosticResult.success && diagnosticResult.data?.can_insert_theoretically ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-amber-50 border-amber-200 text-amber-900"}>
            {diagnosticResult.success && diagnosticResult.data?.can_insert_theoretically ? (
              <CheckCircle className="h-5 w-5 text-amber-600" />
            ) : (
              <XCircle className="h-5 w-5 text-amber-600" />
            )}
            <AlertTitle className="font-bold">Résultat du Diagnostic RLS</AlertTitle>
            <AlertDescription className="mt-2 text-xs font-mono bg-white p-3 rounded border opacity-90 overflow-auto max-h-40">
              {diagnosticResult.success ? (
                <pre>{JSON.stringify(diagnosticResult.data, null, 2)}</pre>
              ) : (
                <span className="text-red-600">{diagnosticResult.error}</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="shadow-sm">
              <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" /> Assigner un Utilisateur</CardTitle>
                <CardDescription>Renseignez l'email exact du compte et choisissez le restaurant cible.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleAssign} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-semibold">Adresse Email du Compte (Existant)</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="admin@restaurant.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white border-gray-300 text-gray-900 focus:ring-indigo-500"
                      required
                    />
                    <p className="text-xs text-muted-foreground">L'utilisateur doit déjà être inscrit via la page de connexion.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="restaurant" className="font-semibold">Restaurant Cible</Label>
                    {loading ? (
                      <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Chargement...</div>
                    ) : (
                      <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant} required>
                        <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-indigo-500">
                          <SelectValue placeholder="Sélectionnez un restaurant..." />
                        </SelectTrigger>
                        <SelectContent>
                          {restaurants.map(rest => (
                            <SelectItem key={rest.id} value={rest.id}>{rest.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="pt-4">
                    <Button type="submit" disabled={submitting || loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11">
                      {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Server className="h-5 w-5 mr-2" />}
                      Forcer l'Assignation
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200 text-blue-900 shadow-sm">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              <AlertTitle className="font-bold">Comment ça marche ?</AlertTitle>
              <AlertDescription className="mt-2 text-sm space-y-2">
                <p>Ce formulaire court-circuite certaines vérifications pour insérer directement un enregistrement dans <code>admin_users</code>.</p>
                <p><strong>Erreur 42501 ?</strong> Cela signifie que les politiques RLS (Row Level Security) bloquent l'opération car votre compte actuel n'est pas reconnu comme administrateur global ou n'a pas les droits sur la table.</p>
              </AlertDescription>
            </Alert>
            
            <Button variant="outline" onClick={() => navigate('/admin/diagnostic-user-assignment')} className="w-full bg-white">
              Voir mon propre statut
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSetupUserAssignmentPage;