import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wrench, AlertTriangle, CheckCircle2, RefreshCw, Users } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useToast } from '@/components/ui/use-toast';
import { AdminCustomerAuditLog } from '@/components/AdminCustomerAuditLog';

const AdminCustomerDeduplicationPage = () => {
  const { restaurantId } = useRestaurant();
  const { toast } = useToast();
  
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState(null);

  const fetchStats = async () => {
    if (!restaurantId) return;
    setLoadingStats(true);
    setCleanupResult(null);
    try {
      const { data, error } = await supabase.rpc('admin_get_duplicate_stats', { p_restaurant_id: restaurantId });
      if (error) throw error;
      setStats(data);
    } catch (err) {
      console.error('Error fetching duplicates stats:', err);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les statistiques.' });
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [restaurantId]);

  const handleCleanup = async () => {
    if (!restaurantId) return;
    if (!confirm("Attention : Cette action va soft-delete tous les doublons (téléphone et user_id) en conservant uniquement le plus récent. Continuer ?")) {
      return;
    }
    
    setIsCleaning(true);
    try {
      const { data, error } = await supabase.rpc('admin_cleanup_duplicate_customers', { p_restaurant_id: restaurantId });
      if (error) throw error;
      
      setCleanupResult(data);
      toast({ title: 'Nettoyage terminé', description: `${data.deleted_count} doublon(s) supprimé(s).` });
      await fetchStats(); // Refresh stats after clean
    } catch (err) {
      console.error('Error during cleanup:', err);
      toast({ variant: 'destructive', title: 'Erreur de nettoyage', description: err.message });
    } finally {
      setIsCleaning(false);
    }
  };

  const totalDupes = stats ? (stats.phone_duplicates + stats.user_duplicates) : 0;

  return (
    <AdminLayout>
      <div className="pb-12 max-w-5xl mx-auto space-y-6 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-6 h-6 text-amber-600" />
              Outil de Déduplication Clients
            </h1>
            <p className="text-slate-500 mt-1">Identifiez et nettoyez les fiches clients en double dans votre base.</p>
          </div>
          <Button onClick={fetchStats} variant="outline" disabled={loadingStats || isCleaning}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingStats ? 'animate-spin' : ''}`} /> Actualiser
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Total Clients Actifs</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-slate-300 my-2" /> : stats?.total || 0}
                  </p>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={stats?.phone_duplicates > 0 ? "border-amber-200" : ""}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Doublons de Téléphone</p>
                  <p className="text-3xl font-bold text-amber-600">
                    {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-slate-300 my-2" /> : stats?.phone_duplicates || 0}
                  </p>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={stats?.user_duplicates > 0 ? "border-amber-200" : ""}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Doublons de Comptes (App)</p>
                  <p className="text-3xl font-bold text-amber-600">
                    {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-slate-300 my-2" /> : stats?.user_duplicates || 0}
                  </p>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Action de Nettoyage Automatique</CardTitle>
            <CardDescription>
              Lancez le script qui conservera la fiche la plus récente et désactivera les autres.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!loadingStats && totalDupes === 0 && (
              <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <AlertTitle className="font-bold">Base de données saine</AlertTitle>
                <AlertDescription>Aucun doublon n'a été détecté. Vos contraintes d'unicité sont respectées.</AlertDescription>
              </Alert>
            )}

            {!loadingStats && totalDupes > 0 && (
              <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <AlertTitle className="font-bold text-amber-800">Doublons détectés</AlertTitle>
                <AlertDescription>
                  <p className="mb-3">La base contient des enregistrements en double. Il est recommandé de nettoyer avant de rajouter des contraintes strictes.</p>
                  <Button 
                    onClick={handleCleanup} 
                    disabled={isCleaning} 
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {isCleaning ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Nettoyage en cours...</>
                    ) : (
                      <><Wrench className="w-4 h-4 mr-2" /> Lancer la Déduplication ({totalDupes} enregistrements)</>
                    )}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {cleanupResult && (
              <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <AlertTitle className="font-bold">Rapport de Nettoyage</AlertTitle>
                <AlertDescription>
                  Le nettoyage est terminé. <strong>{cleanupResult.deleted_count}</strong> enregistrement(s) en double ont été archivés.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <AdminCustomerAuditLog />
      </div>
    </AdminLayout>
  );
};

export default AdminCustomerDeduplicationPage;