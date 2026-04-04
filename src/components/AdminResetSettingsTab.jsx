import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Clock, RefreshCw, AlertCircle, CheckCircle2, Trash2, ShieldAlert, AlertTriangle, TerminalSquare, Database, ListChecks } from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';
import { ResetDataModal } from '@/components/ResetDataModal';
import { runResetDiagnostics, executeProductionReset, verifyResetCompletion, runAdvancedDiagnostics, forceDeleteRemainingData } from '@/lib/resetTestData';

export const AdminResetSettingsTab = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  
  const [diagnostics, setDiagnostics] = useState(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [resetProgress, setResetProgress] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);
  
  const [detailedErrors, setDetailedErrors] = useState([]);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  
  const [advancedDiagResult, setAdvancedDiagResult] = useState(null);
  const [isRunningDiag, setIsRunningDiag] = useState(false);
  const [isForceDeleting, setIsForceDeleting] = useState(false);

  const [securityToken, setSecurityToken] = useState("");

  const { toast } = useToast();

  const [settings, setSettings] = useState({
    daily_reset_time: '00:00',
    daily_reset_enabled: true,
    last_reset_at: null
  });

  const fetchSettingsAndCounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_config')
        .select('*')
        .in('config_key', ['daily_reset_time', 'daily_reset_enabled', 'last_reset_at']);

      if (error) throw error;

      const newSettings = {
        daily_reset_time: data?.find(c => c.config_key === 'daily_reset_time')?.config_value || '00:00',
        daily_reset_enabled: data?.find(c => c.config_key === 'daily_reset_enabled')?.config_value === 'true',
        last_reset_at: data?.find(c => c.config_key === 'last_reset_at')?.config_value || null
      };

      setSettings(newSettings);
    } catch (error) {
      console.error('Error fetching settings/counts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndCounts();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = [
        { config_key: 'daily_reset_time', config_value: settings.daily_reset_time },
        { config_key: 'daily_reset_enabled', config_value: String(settings.daily_reset_enabled) }
      ];

      const { error } = await supabase
        .from('admin_config')
        .upsert(updates, { onConflict: 'config_key' });

      if (error) throw error;

      toast({ title: "Succès", description: "Paramètres mis à jour.", className: "bg-amber-50" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de la sauvegarde." });
    } finally {
      setSaving(false);
    }
  };

  const handlePrepareReset = async () => {
     setIsDiagnosing(true);
     setDiagnostics(null);
     setResetProgress([]);
     setIsFinished(false);
     setResultSummary(null);
     setDetailedErrors([]);
     setShowErrorDetails(false);
     
     try {
        const diagResults = await runResetDiagnostics();
        setDiagnostics(diagResults);
        setShowResetModal(true);
     } catch (err) {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible d'analyser l'environnement." });
     } finally {
        setIsDiagnosing(false);
     }
  };

  const handleProgressUpdate = (update) => {
     setResetProgress(prev => {
        const exists = prev.findIndex(p => p.table === update.table);
        if (exists >= 0) {
           const newProgress = [...prev];
           newProgress[exists] = { ...newProgress[exists], ...update };
           return newProgress;
        }
        return [...prev, update];
     });
  };

  const handleFullReset = async () => {
    setResetting(true);
    setIsFinished(false);
    setResultSummary(null);
    setDetailedErrors([]);

    try {
      const result = await executeProductionReset(securityToken, handleProgressUpdate);
      setResultSummary(result);
      
      if (result.errors && result.errors.length > 0) {
        setDetailedErrors(result.errors);
      }

      if (result.success) {
         setSettings(prev => ({...prev, last_reset_at: result.completedAt }));
         await supabase.from('admin_config').upsert({ config_key: 'last_reset_at', config_value: result.completedAt }, { onConflict: 'config_key' });
         setSecurityToken("");
         toast({ title: "Purge terminée", description: `La purge a réussi. ${result.totalDeleted} enregistrements supprimés au total.` });
      } else {
         toast({ variant: "destructive", title: "Réinitialisation partielle", description: "Consultez le rapport pour les tables restantes ou les erreurs survenues." });
      }

    } catch (error) {
      toast({ variant: "destructive", title: "Erreur critique", description: "Processus interrompu." });
    } finally {
      setResetting(false);
      setIsFinished(true);
    }
  };

  const handleRunAdvancedDiagnostics = async () => {
      setIsRunningDiag(true);
      const res = await runAdvancedDiagnostics();
      setAdvancedDiagResult(res);
      setIsRunningDiag(false);
      if (res?.success) {
          toast({ title: "Diagnostic terminé", description: res.message });
      } else {
          toast({ variant: "destructive", title: "Erreur", description: res?.message || "Échec du diagnostic." });
      }
  };

  const handleForceDeleteRemaining = async () => {
      if (!resultSummary?.remainingTables || Object.keys(resultSummary.remainingTables).length === 0) return;
      
      setIsForceDeleting(true);
      const tablesToClear = Object.keys(resultSummary.remainingTables).filter(t => t !== 'audit_logs');
      
      const res = await forceDeleteRemainingData(tablesToClear);
      
      if (res.success) {
          toast({ title: "Succès", description: "Données restantes supprimées de force." });
          const newVerification = await verifyResetCompletion();
          // Update the summary with the new verification results
          setResultSummary(prev => ({ 
            ...prev, 
            remainingTables: newVerification.tables_with_data,
            success: newVerification.success 
          }));
      } else {
          toast({ variant: "destructive", title: "Erreur de suppression forcée", description: res.errors.join(", ") });
      }
      setIsForceDeleting(false);
  };

  return (
    <div className="space-y-6">
      
      {detailedErrors.length > 0 && (
        <Card className="border-red-300 shadow-sm animate-in slide-in-from-top-2">
           <CardHeader className="bg-red-50 border-b border-red-100 pb-4">
              <CardTitle className="text-red-800 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <ShieldAlert className="h-5 w-5" />
                   Avertissements / Erreurs détectées
                 </div>
                 <Button variant="outline" size="sm" className="bg-white hover:bg-red-50 text-red-700 border-red-200" onClick={() => setShowErrorDetails(!showErrorDetails)}>
                    {showErrorDetails ? 'Masquer les détails' : 'Voir les détails'}
                 </Button>
              </CardTitle>
           </CardHeader>
           {showErrorDetails && (
               <CardContent className="p-0">
                  <div className="divide-y divide-red-100">
                     {detailedErrors.map((err, idx) => (
                        <div key={idx} className="p-4 bg-white hover:bg-slate-50">
                           <p className="text-sm text-slate-800 font-medium">{err.message}</p>
                        </div>
                     ))}
                  </div>
               </CardContent>
           )}
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Réinitialisation Quotidienne
          </CardTitle>
          <CardDescription>
            Configurez l'archivage automatique des commandes à la fin de la journée.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
             <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between border p-4 rounded-lg bg-gray-50">
                  <div className="space-y-0.5">
                    <Label className="text-base">Activation Automatique</Label>
                    <p className="text-sm text-muted-foreground">Activer la bascule quotidienne automatique</p>
                  </div>
                  <Switch checked={settings.daily_reset_enabled} onCheckedChange={(checked) => setSettings(prev => ({...prev, daily_reset_enabled: checked}))} />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="reset-time">Heure de réinitialisation</Label>
                  <Input type="time" id="reset-time" value={settings.daily_reset_time} onChange={(e) => setSettings(prev => ({...prev, daily_reset_time: e.target.value}))} className="w-full md:w-48" />
                </div>
             </div>

             <div className="flex-1 w-full bg-blue-50/50 p-6 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center space-y-3">
                <h3 className="font-semibold text-blue-900">Dernière Exécution</h3>
                {settings.last_reset_at ? (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-amber-600 justify-center">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">Terminé avec succès</span>
                        </div>
                        <p className="text-sm text-gray-600 font-mono bg-white px-3 py-1.5 rounded-md border shadow-sm">
                            {formatDateTime(settings.last_reset_at)}
                        </p>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                        <AlertCircle className="h-5 w-5" />
                        <span>Jamais exécuté manuellement</span>
                    </div>
                )}
             </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t px-6 py-4 bg-gray-50/50">
           <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? 'Sauvegarde...' : 'Enregistrer les paramètres'}
           </Button>
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <Card className="border-blue-200">
            <CardHeader className="bg-blue-50 border-b border-blue-100">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Database className="h-5 w-5" />
                    Diagnostics de Réinitialisation
                </CardTitle>
                <CardDescription>Vérifiez les clés étrangères bloquantes et les données résiduelles.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <Button variant="outline" className="w-full" onClick={handleRunAdvancedDiagnostics} disabled={isRunningDiag}>
                    {isRunningDiag ? <RefreshCw className="mr-2 h-4 w-4 animate-spin"/> : <TerminalSquare className="mr-2 h-4 w-4"/>}
                    Lancer l'Analyse Avancée
                </Button>

                {advancedDiagResult && (
                    <div className="mt-4 p-4 rounded text-xs overflow-auto max-h-48 border bg-slate-50 border-slate-200">
                        <p className="font-bold mb-2 text-slate-800">Données Restantes :</p>
                        {advancedDiagResult.remaining_data?.length > 0 ? (
                            <ul className="list-disc pl-4 mb-4 text-red-600 font-mono">
                                {advancedDiagResult.remaining_data.map(r => <li key={r.table}>{r.table}: {r.count} lignes</li>)}
                            </ul>
                        ) : <p className="text-amber-600 mb-4">Aucune donnée trouvée.</p>}

                        <p className="font-bold mb-2 text-slate-800">Clés Étrangères Bloquantes (Sans CASCADE) :</p>
                        {advancedDiagResult.blocking_fks?.length > 0 ? (
                            <ul className="list-disc pl-4 text-amber-600 font-mono">
                                {advancedDiagResult.blocking_fks.map(fk => <li key={fk.constraint_name}>{fk.table_name} → {fk.foreign_table_name} ({fk.constraint_name})</li>)}
                            </ul>
                        ) : <p className="text-amber-600">Aucune contrainte bloquante trouvée.</p>}
                    </div>
                )}
            </CardContent>
        </Card>

        <Card className="border-red-200 overflow-hidden">
            <CardHeader className="bg-red-50 border-b border-red-100">
            <CardTitle className="flex items-center gap-2 text-red-700">
                <ShieldAlert className="h-5 w-5" />
                PRODUCTION RESET (WIPE TOTAL)
            </CardTitle>
            <CardDescription className="text-red-600/80">
                Utilise TRUNCATE CASCADE pour forcer la suppression rapide de toutes les tables transactionnelles.
            </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
            <div className="flex flex-col space-y-6">
                <div className="bg-red-50/50 p-4 rounded-lg border border-red-200 flex flex-col items-center justify-center gap-4">
                    <div className="w-full space-y-1.5 text-center">
                        <Label className="text-red-800 font-bold">Sécurité : Confirmez la purge totale</Label>
                        <p className="text-xs text-red-600 mb-2">Tapez <strong>CONFIRM_PRODUCTION_WIPE</strong></p>
                        <Input 
                        value={securityToken} 
                        onChange={e => setSecurityToken(e.target.value)} 
                        placeholder="CONFIRM_PRODUCTION_WIPE"
                        className="border-red-300 focus-visible:ring-red-500 text-center font-mono"
                        />
                    </div>
                    <Button 
                    variant="destructive" 
                    size="lg" 
                    className="whitespace-nowrap shadow-md hover:shadow-xl transition-all font-bold w-full"
                    onClick={handlePrepareReset}
                    disabled={isDiagnosing || securityToken !== 'CONFIRM_PRODUCTION_WIPE'}
                    >
                        {isDiagnosing ? <RefreshCw className="h-5 w-5 mr-2 animate-spin"/> : <Trash2 className="h-5 w-5 mr-2" />}
                        {isDiagnosing ? 'Analyse & Diagnostics...' : 'Démarrer la purge totale (TRUNCATE)'}
                    </Button>
                </div>
            </div>
            </CardContent>
        </Card>
      </div>

      {isFinished && resultSummary && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
              <Card className={`border ${resultSummary.success ? 'border-amber-200 bg-amber-50' : 'border-amber-200 bg-amber-50'}`}>
                <CardHeader className="py-4 border-b border-black/5">
                    <CardTitle className={`text-lg flex items-center justify-between ${resultSummary.success ? 'text-amber-800' : 'text-amber-800'}`}>
                        <div className="flex items-center gap-2">
                           {resultSummary.success ? <CheckCircle2 className="h-5 w-5"/> : <AlertTriangle className="h-5 w-5"/>}
                           Rapport de Vérification de Purge Finale
                        </div>
                        
                        {!resultSummary.success && Object.keys(resultSummary.remainingTables || {}).length > 0 && (
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={handleForceDeleteRemaining}
                                disabled={isForceDeleting}
                                className="shadow-sm"
                            >
                                {isForceDeleting ? <RefreshCw className="h-4 w-4 animate-spin mr-2"/> : <Trash2 className="h-4 w-4 mr-2"/>}
                                Forcer la suppression
                            </Button>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-3 rounded-md border shadow-sm">
                            <div className="flex-1 text-center border-r md:border-r-0 md:border-b-0 border-slate-100">
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Enregistrements supprimés</p>
                                <p className="text-2xl font-bold text-slate-800">{resultSummary.totalDeleted}</p>
                            </div>
                            <div className="flex-1 text-center">
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Tables restantes</p>
                                <p className={`text-2xl font-bold ${Object.keys(resultSummary.remainingTables || {}).length > 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                  {Object.keys(resultSummary.remainingTables || {}).length}
                                </p>
                            </div>
                        </div>
                        
                        {resultSummary.success ? (
                            <div className="flex items-center gap-2 p-3 bg-amber-100/50 rounded-md text-amber-800 text-sm font-medium border border-amber-200">
                               <ListChecks className="h-5 w-5 text-amber-600" />
                               Toutes les tables transactionnelles critiques sont confirmées vides (0 enregistrement).
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-amber-800 mb-2 border-b border-amber-200 pb-1">Données persistantes après la purge :</p>
                                {Object.entries(resultSummary.remainingTables || {}).map(([tableName, count]) => (
                                    <div key={tableName} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-amber-100 shadow-sm">
                                        <span className="font-medium text-slate-700">{tableName}</span>
                                        <span className="font-bold flex items-center gap-1.5 text-red-600">
                                            <AlertTriangle className="h-3.5 w-3.5"/> 
                                            {count} ligne(s) restante(s)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
              </Card>
          </div>
      )}

      <ResetDataModal 
         open={showResetModal} 
         onOpenChange={setShowResetModal}
         onConfirm={handleFullReset}
         loading={resetting}
         diagnostics={diagnostics}
         progressData={resetProgress}
         isFinished={isFinished}
         resultSummary={resultSummary}
      />
    </div>
  );
};