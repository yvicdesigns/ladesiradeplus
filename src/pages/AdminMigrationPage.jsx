import React, { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { runOrderStatusMigration } from '@/lib/orderMigration';
import { Loader2, CheckCircle, AlertTriangle, Database, PlayCircle } from 'lucide-react';

export const AdminMigrationPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRunMigration = async () => {
    if (!window.confirm("Cette action va mettre à jour les statuts des commandes dans la base de données. Êtes-vous sûr de vouloir continuer ?")) {
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const outcome = await runOrderStatusMigration();
      
      if (outcome.success) {
        setResult(outcome.report);
      } else {
        setError(outcome.error);
        if (outcome.report) setResult(outcome.report); // Show partial results if available
      }
    } catch (err) {
      setError(err.message || "Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance Système</h1>
          <p className="text-muted-foreground mt-2">Outils de migration et de correction de données.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <Database className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <CardTitle>Migration des Statuts de Commande</CardTitle>
                    <CardDescription>
                        Standardisation des statuts de livraison (ex: "pending" → "new").
                    </CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md text-sm text-yellow-800 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>
                    Utilisez cet outil si vous constatez que certaines commandes ne peuvent pas être traitées ou si les boutons d'action ne s'affichent pas. 
                    Cela convertira les anciens statuts vers le nouveau format standardisé.
                </p>
            </div>

            <div className="flex justify-start">
                <Button 
                    onClick={handleRunMigration} 
                    disabled={loading}
                    className="min-w-[200px]"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Migration en cours...
                        </>
                    ) : (
                        <>
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Lancer la migration
                        </>
                    )}
                </Button>
            </div>

            {/* RESULTS SECTION */}
            {result && (
                <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <Alert className="bg-amber-50 border-amber-200">
                        <CheckCircle className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-800 font-bold">Migration terminée</AlertTitle>
                        <AlertDescription className="text-amber-700">
                            {result.updated} commandes mises à jour sur {result.totalProcessed} analysées.
                        </AlertDescription>
                    </Alert>

                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-4 py-2 border-b font-medium text-sm">Détails des modifications</div>
                        <div className="bg-white p-4 text-sm font-mono space-y-2">
                            {Object.entries(result.breakdown).length === 0 ? (
                                <p className="text-gray-500 italic">Aucune modification nécessaire. Toutes les données sont à jour.</p>
                            ) : (
                                Object.entries(result.breakdown).map(([key, count]) => (
                                    <div key={key} className="flex justify-between items-center border-b border-gray-100 last:border-0 pb-1">
                                        <span>{key}</span>
                                        <span className="font-bold">{count}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {result.errors.length > 0 && (
                        <div className="border border-red-200 rounded-lg overflow-hidden bg-red-50">
                            <div className="bg-red-100 px-4 py-2 border-b border-red-200 font-medium text-sm text-red-800">Erreurs ({result.errors.length})</div>
                            <div className="p-4 text-xs font-mono text-red-700 max-h-40 overflow-y-auto">
                                {result.errors.map((err, i) => (
                                    <div key={i}>{err}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreur Critique</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminMigrationPage;