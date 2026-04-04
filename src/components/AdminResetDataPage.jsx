import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trash2, ShieldAlert, AlertTriangle, CheckCircle2, 
  RefreshCw, TerminalSquare, Database, ServerCrash, 
  Info, Loader2, Copy
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { runResetDiagnostics, executeProductionReset } from '@/lib/resetTestData';

export const AdminResetDataPage = () => {
  const [securityToken, setSecurityToken] = useState("");
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);
  
  const [isResetting, setIsResetting] = useState(false);
  const [progressData, setProgressData] = useState([]);
  const [resultSummary, setResultSummary] = useState(null);
  
  const { toast } = useToast();

  useEffect(() => {
    handleRunDiagnostics();
  }, []);

  const handleRunDiagnostics = async () => {
    setIsDiagnosing(true);
    try {
      const diag = await runResetDiagnostics();
      setDiagnostics(diag);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'analyser l'environnement." });
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleProgressUpdate = (update) => {
    setProgressData(prev => {
      const exists = prev.findIndex(p => p.table === update.table);
      if (exists >= 0) {
        const newProgress = [...prev];
        newProgress[exists] = { ...newProgress[exists], ...update };
        return newProgress;
      }
      return [...prev, update];
    });
  };

  const handleExecuteReset = async () => {
    if (securityToken !== 'CONFIRM_PRODUCTION_WIPE') return;
    
    setIsResetting(true);
    setProgressData([]);
    setResultSummary(null);

    try {
      const result = await executeProductionReset(securityToken, handleProgressUpdate);
      setResultSummary(result);
      
      if (result.success) {
        toast({ title: "Purge terminée", description: `La purge a réussi. ${result.totalDeleted} enregistrements supprimés.` });
        setSecurityToken(""); // Clear token on success
      } else {
        toast({ variant: "destructive", title: "Réinitialisation partielle", description: "Des erreurs se sont produites durant le processus." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur critique", description: error.message });
    } finally {
      setIsResetting(false);
      handleRunDiagnostics(); // Refresh diagnostics
    }
  };

  const copyLogsToClipboard = () => {
    const logs = progressData.map(p => `[${p.status.toUpperCase()}] ${p.table}: ${p.message || ''} ${p.error || ''}`).join('\n');
    navigator.clipboard.writeText(logs);
    toast({ title: "Copié", description: "Journal copié dans le presse-papiers." });
  };

  const renderStatusIcon = (status) => {
    if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-amber-500" />;
    if (status === 'error') return <ServerCrash className="h-4 w-4 text-red-500" />;
    if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. Header / Danger Zone Info */}
      <Alert variant="destructive" className="border-red-600 bg-red-50 text-red-900 shadow-sm">
        <ShieldAlert className="h-5 w-5 !text-red-600" />
        <AlertTitle className="font-bold text-lg flex items-center gap-2">
          ZONE DE DANGER : Purge Totale
        </AlertTitle>
        <AlertDescription className="mt-2 text-sm leading-relaxed">
          Cette action effacera <strong>toutes les données transactionnelles</strong> de la base (commandes, clients, livraisons, paiements, etc.). 
          Elle utilise une méthode sécurisée en deux étapes (TRUNCATE CASCADE puis DELETE) pour contourner les blocages de clés étrangères. 
          Cette action est irréversible.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Controls & Setup */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  État des Données
                </div>
                <Button variant="ghost" size="icon" onClick={handleRunDiagnostics} disabled={isDiagnosing || isResetting}>
                  <RefreshCw className={`h-4 w-4 ${isDiagnosing ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {isDiagnosing && !diagnostics ? (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p className="text-sm">Analyse de la base de données...</p>
                </div>
              ) : diagnostics ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <span className="text-sm font-medium">Total des enregistrements</span>
                    <Badge variant={diagnostics.totalRows > 0 ? "default" : "outline"} className="text-lg">
                      {diagnostics.totalRows}
                    </Badge>
                  </div>
                  
                  {diagnostics.potentialBlockers?.length > 0 && (
                    <Alert className="border-amber-200 bg-amber-50">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800 text-sm">Bloqueurs potentiels</AlertTitle>
                      <AlertDescription className="text-xs text-amber-700 mt-1">
                        {diagnostics.potentialBlockers.length} contraintes de clés étrangères sans règle CASCADE détectées. La suppression en deux étapes gèrera cela.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <ScrollArea className="h-[200px] border rounded-md p-2">
                    <div className="space-y-1">
                      {Object.entries(diagnostics.tables || {}).map(([table, info]) => (
                        <div key={table} className="flex items-center justify-between text-sm p-1.5 hover:bg-muted/50 rounded">
                          <span className="font-mono text-xs">{table}</span>
                          <span className={`font-semibold ${info.count > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                            {info.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Diagnostic non disponible</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-red-200 shadow-sm overflow-hidden">
            <CardContent className="p-6 bg-red-50/30 flex flex-col items-center text-center space-y-4">
              <Label className="text-red-800 font-bold text-base">Sécurité : Confirmez la purge totale</Label>
              <p className="text-xs text-red-600">Tapez <strong>CONFIRM_PRODUCTION_WIPE</strong></p>
              
              <Input 
                value={securityToken} 
                onChange={e => setSecurityToken(e.target.value)} 
                placeholder="CONFIRM_PRODUCTION_WIPE"
                className="border-red-300 focus-visible:ring-red-500 text-center font-mono"
                disabled={isResetting}
              />
              
              <Button 
                variant="destructive" 
                size="lg" 
                className="w-full font-bold"
                onClick={handleExecuteReset}
                disabled={isResetting || securityToken !== 'CONFIRM_PRODUCTION_WIPE'}
              >
                {isResetting ? <Loader2 className="h-5 w-5 mr-2 animate-spin"/> : <Trash2 className="h-5 w-5 mr-2" />}
                {isResetting ? 'Purge en cours...' : 'Démarrer la purge'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Progress & Logs */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm h-full flex flex-col">
            <CardHeader className="bg-muted/30 pb-4 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TerminalSquare className="h-5 w-5 text-primary" />
                  Journal d'Exécution
                </CardTitle>
                <CardDescription>
                  Suivi en temps réel de la suppression sécurisée
                </CardDescription>
              </div>
              {progressData.length > 0 && (
                <Button variant="outline" size="sm" onClick={copyLogsToClipboard} className="gap-2">
                  <Copy className="h-4 w-4" /> Copier
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-4 flex-1 flex flex-col">
              
              {isResetting && (
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-primary animate-pulse">Traitement en cours...</span>
                  </div>
                  <Progress value={undefined} className="h-2" />
                </div>
              )}

              {progressData.length === 0 && !isResetting && !resultSummary ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50 py-12">
                  <TerminalSquare className="h-12 w-12 mb-4" />
                  <p>Aucune exécution récente.</p>
                </div>
              ) : (
                <ScrollArea className="flex-1 h-[400px] border rounded-md bg-black text-green-400 font-mono text-xs p-4 shadow-inner">
                  <div className="space-y-2">
                    {progressData.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-3 border-b border-green-900/30 pb-2 last:border-0">
                        <div className="mt-0.5">{renderStatusIcon(log.status)}</div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-green-300">[{log.table}]</span>
                            {log.count !== undefined && (
                              <span className="text-amber-500">{log.count} lignes</span>
                            )}
                          </div>
                          {log.message && <p className="text-amber-600/90 mt-1">{log.message}</p>}
                          {log.error && <p className="text-red-400 mt-1">Erreur: {log.error}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {resultSummary && (
                <div className={`mt-4 p-4 rounded-lg border ${resultSummary.success ? 'bg-amber-50 border-amber-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {resultSummary.success ? <CheckCircle2 className="h-5 w-5 text-amber-600"/> : <AlertTriangle className="h-5 w-5 text-amber-600"/>}
                    <h3 className={`font-bold ${resultSummary.success ? 'text-amber-800' : 'text-amber-800'}`}>
                      {resultSummary.success ? 'Purge Terminée avec Succès' : 'Purge Partielle / Avertissements'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="bg-white p-2 rounded border shadow-sm text-center">
                      <p className="text-xs text-muted-foreground">Total Supprimé</p>
                      <p className="text-xl font-bold">{resultSummary.totalDeleted}</p>
                    </div>
                    <div className="bg-white p-2 rounded border shadow-sm text-center">
                      <p className="text-xs text-muted-foreground">Tables Restantes</p>
                      <p className={`text-xl font-bold ${Object.keys(resultSummary.remainingTables || {}).length > 0 ? 'text-red-500' : 'text-amber-500'}`}>
                        {Object.keys(resultSummary.remainingTables || {}).length}
                      </p>
                    </div>
                  </div>
                  {resultSummary.errors?.length > 0 && (
                    <div className="mt-3 bg-red-50 border border-red-100 rounded p-2 max-h-32 overflow-y-auto">
                      <p className="text-xs font-bold text-red-800 mb-1">Erreurs rencontrées :</p>
                      <ul className="list-disc pl-4 text-xs text-red-600 space-y-1">
                        {resultSummary.errors.map((err, i) => <li key={i}>{err.message}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};