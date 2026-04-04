import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, AlertCircle, Building2, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const TARGET_RESTAURANT_ID = '7eedf081-0268-4867-af38-61fa5932420a';

export default function AdminRestaurantsDiagnosticPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRestaurants = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      
      setRestaurants(data || []);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des restaurants.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const targetRestaurantFound = restaurants.some(r => r.id === TARGET_RESTAURANT_ID);

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Diagnostic des Restaurants</h1>
            <p className="text-muted-foreground mt-1">
              Analyse de la table "restaurants" et vérification de l'ID cible.
            </p>
          </div>
          <Button onClick={fetchRestaurants} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total des Restaurants</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : restaurants.length}
              </div>
            </CardContent>
          </Card>
          
          <Card className={targetRestaurantFound ? 'border-green-500 bg-amber-50/50' : 'border-red-500 bg-red-50/50'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Statut du Restaurant Cible</CardTitle>
              {targetRestaurantFound ? (
                <CheckCircle className="h-4 w-4 text-amber-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="font-bold text-sm break-all">
                {loading ? (
                  <Skeleton className="h-5 w-full" />
                ) : (
                  TARGET_RESTAURANT_ID
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {loading ? '' : targetRestaurantFound ? 'Trouvé dans la base de données' : 'Introuvable dans la base de données'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des Restaurants</CardTitle>
            <CardDescription>Tous les enregistrements trouvés dans la table public.restaurants</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">ID</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Slug / Domaine</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Créé le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : restaurants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Aucun restaurant trouvé.
                      </TableCell>
                    </TableRow>
                  ) : (
                    restaurants.map((restaurant) => {
                      const isTarget = restaurant.id === TARGET_RESTAURANT_ID;
                      return (
                        <TableRow 
                          key={restaurant.id} 
                          className={isTarget ? 'bg-amber-50/50 hover:bg-amber-50' : ''}
                        >
                          <TableCell className="font-mono text-xs">
                            <div className="flex items-center gap-2">
                              {restaurant.id}
                              {isTarget && (
                                <Badge variant="default" className="bg-green-600 hover:bg-green-700">Cible</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {restaurant.name}
                            {restaurant.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={restaurant.description}>
                                {restaurant.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {restaurant.slug && <Badge variant="outline" className="w-fit">{restaurant.slug}</Badge>}
                              {restaurant.domain && <span className="text-xs text-muted-foreground">{restaurant.domain}</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {restaurant.is_active ? (
                              <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">Actif</Badge>
                            ) : (
                              <Badge variant="secondary">Inactif</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {restaurant.created_at ? format(new Date(restaurant.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}