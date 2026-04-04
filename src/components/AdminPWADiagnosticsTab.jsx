import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, XCircle, RefreshCw, Trash2, Smartphone } from 'lucide-react';
import { checkSWRegistration, getCacheStatus, validateManifest, clearCache } from '@/lib/pwaUtils';

export const AdminPWADiagnosticsTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [status, setStatus] = useState({
    sw: null,
    cache: null,
    manifest: null
  });

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const [swRes, cacheRes, manifestRes] = await Promise.all([
        checkSWRegistration(),
        getCacheStatus(),
        validateManifest()
      ]);
      setStatus({ sw: swRes, cache: cacheRes, manifest: manifestRes });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const handleClearCache = async () => {
    setClearing(true);
    const success = await clearCache();
    if (success) {
      toast({ title: "Cache nettoyé", description: "Le cache PWA a été vidé avec succès. L'application va se recharger." });
      setTimeout(() => window.location.reload(), 1500);
    } else {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de vider le cache." });
      setClearing(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold">État de la PWA (Application Mobile)</h2>
          <p className="text-sm text-muted-foreground">Diagnostics d'installation et de cache hors-ligne.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={runDiagnostics}>
            <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClearCache} disabled={clearing}>
            {clearing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Vider le Cache
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Service Worker Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" /> Service Worker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mt-2">
              {status.sw?.status === 'registered' ? (
                <Badge variant="success" className="gap-1 bg-amber-100 text-amber-800"><CheckCircle2 className="h-3 w-3" /> Actif</Badge>
              ) : (
                <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Inactif</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-3">{status.sw?.message}</p>
          </CardContent>
        </Card>

        {/* Cache Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-500" /> Stockage Cache
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex flex-col mt-2 gap-1">
                <span className="text-2xl font-bold">{formatBytes(status.cache?.size || 0)}</span>
                <span className="text-xs text-muted-foreground">Utilisé par l'application</span>
             </div>
             <div className="mt-3 text-xs text-muted-foreground space-y-1">
               {status.cache?.caches?.map((c, i) => (
                 <div key={i} className="flex justify-between">
                   <span className="truncate mr-2">{c.name}</span>
                   <span className="font-mono bg-muted px-1 rounded">{c.count} entrées</span>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>

        {/* Manifest Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-500" /> Manifest.json
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mt-2">
              {status.manifest?.valid ? (
                <Badge variant="success" className="gap-1 bg-amber-100 text-amber-800"><CheckCircle2 className="h-3 w-3" /> Valide</Badge>
              ) : (
                <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Erreurs</Badge>
              )}
            </div>
            {!status.manifest?.valid && status.manifest?.errors && (
              <ul className="mt-3 text-xs text-red-500 list-disc pl-4">
                {status.manifest.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};