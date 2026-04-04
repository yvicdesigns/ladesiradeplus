import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldCheck, ShieldAlert, Lock, Database, Loader2, RefreshCw, Server, User, TerminalSquare, BellRing } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { verifyRlsIsolation } from '@/lib/restaurantUtils';
import { auditNotificationPreferencesRLS, generateNotificationPrefsSQLFix } from '@/lib/notificationPreferencesRLSAudit';

export const AdminSecurityAuditPage = () => {
  const { user, role } = useAuth();
  const { restaurantId, activeRestaurantName, isLocked } = useRestaurant();
  const [loading, setLoading] = useState(true);
  const [rlsStatus, setRlsStatus] = useState(null);
  
  // Notification Prefs Audit State
  const [notifAuditLoading, setNotifAuditLoading] = useState(false);
  const [notifAuditResults, setNotifAuditResults] = useState(null);
  const [showSqlFix, setShowSqlFix] = useState(false);

  const runAudit = async () => {
    setLoading(true);
    try {
      if (restaurantId) {
        const result = await verifyRlsIsolation(restaurantId);
        setRlsStatus(result);
      }
    } catch (e) {
      setRlsStatus({ success: false, error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const runNotificationPrefsAudit = async () => {
    if (!user || !user.id) return;
    setNotifAuditLoading(true);
    try {
      const results = await auditNotificationPreferencesRLS(user.id);
      setNotifAuditResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setNotifAuditLoading(false);
    }
  };

  useEffect(() => {
    runAudit();
    if (user?.id) {
      runNotificationPrefsAudit();
    }
  }, [restaurantId, user]);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
               <ShieldCheck className="h-8 w-8 text-primary" /> Audit de Sécurité
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Vérification de l'isolation des données (Multi-Tenant) et des règles RLS.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { runAudit(); runNotificationPrefsAudit(); }} disabled={loading || notifAuditLoading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${(loading || notifAuditLoading) ? 'animate-spin' : ''}`} />
              Actualiser tout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identity Info */}
          <Card>
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-blue-500" /> Identité & Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</span>
                <p className="font-medium bg-muted p-2 rounded-md font-mono text-sm">{user?.email || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID Utilisateur</span>
                <p className="font-medium bg-muted p-2 rounded-md font-mono text-xs break-all">{user?.id || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rôle RBAC</span>
                <div>
                   <Badge className={role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}>
                     {role?.toUpperCase()}
                   </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tenant Info */}
          <Card>
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5 text-amber-500" /> Environnement Isolé (Tenant)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Restaurant Assigné</span>
                <p className="font-bold text-lg">{activeRestaurantName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID Restaurant</span>
                <p className="font-medium bg-muted p-2 rounded-md font-mono text-xs break-all text-amber-600">{restaurantId || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut Verrouillage UI</span>
                <div className="flex items-center gap-2 mt-1">
                   {isLocked ? (
                     <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200"><Lock className="h-3 w-3 mr-1" /> Sécurisé (Immuable)</Badge>
                   ) : (
                     <Badge variant="destructive"><ShieldAlert className="h-3 w-3 mr-1" /> Vulnérable</Badge>
                   )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database RLS Audit - Global */}
        <Card className="border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2"><Server className="h-5 w-5" /> Audit d'Isolation RLS (Multi-Tenant)</span>
              {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            </CardTitle>
            <CardDescription>Vérifie que la base de données bloque physiquement l'accès aux données des autres restaurants.</CardDescription>
          </CardHeader>
          <CardContent>
            {rlsStatus ? (
              rlsStatus.success ? (
                <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                  <ShieldCheck className="h-5 w-5 text-amber-600" />
                  <AlertTitle className="font-bold">Isolation Validée</AlertTitle>
                  <AlertDescription className="mt-2 text-amber-700">
                    <p>Le moteur de base de données filtre correctement les requêtes. {rlsStatus.message}</p>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <ShieldAlert className="h-5 w-5" />
                  <AlertTitle className="font-bold">VIOLATION DE SÉCURITÉ</AlertTitle>
                  <AlertDescription className="mt-2 font-mono text-xs">
                    {rlsStatus.error}
                  </AlertDescription>
                </Alert>
              )
            ) : (
              <div className="h-24 flex items-center justify-center bg-muted/50 rounded-lg">
                <span className="text-muted-foreground text-sm">En attente des résultats de l'audit...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Preferences RLS Audit */}
        <Card className="border-t-4 border-t-green-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2"><BellRing className="h-5 w-5 text-amber-600" /> Audit RLS: Préférences de Notification</span>
              {notifAuditLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            </CardTitle>
            <CardDescription>Vérifie les permissions CRUD de l'utilisateur sur la table <code className="bg-muted px-1 py-0.5 rounded text-xs">notification_preferences</code>.</CardDescription>
          </CardHeader>
          <CardContent>
            {notifAuditResults ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`p-3 rounded-lg border ${notifAuditResults.select.success ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                     <div className="font-bold text-sm mb-1 flex items-center justify-between">
                       Lecture (SELECT)
                       {notifAuditResults.select.success ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                     </div>
                     <div className="text-xs">{notifAuditResults.select.success ? 'Succès' : notifAuditResults.select.error}</div>
                  </div>
                  <div className={`p-3 rounded-lg border ${notifAuditResults.insert.success ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                     <div className="font-bold text-sm mb-1 flex items-center justify-between">
                       Création (INSERT)
                       {notifAuditResults.insert.success ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                     </div>
                     <div className="text-xs">{notifAuditResults.insert.success ? 'Succès' : notifAuditResults.insert.error}</div>
                  </div>
                  <div className={`p-3 rounded-lg border ${notifAuditResults.update.success ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                     <div className="font-bold text-sm mb-1 flex items-center justify-between">
                       Modification (UPDATE)
                       {notifAuditResults.update.success ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                     </div>
                     <div className="text-xs">{notifAuditResults.update.success ? 'Succès' : notifAuditResults.update.error}</div>
                  </div>
                </div>

                {notifAuditResults.sqlFixRequired && (
                  <div className="mt-6 space-y-3">
                    <Alert variant="destructive">
                      <TerminalSquare className="h-4 w-4" />
                      <AlertTitle>Action Requise</AlertTitle>
                      <AlertDescription>
                        Les politiques RLS de la table <code className="bg-red-100 px-1 py-0.5 rounded text-xs text-red-900">notification_preferences</code> sont absentes ou mal configurées. Cela empêche la sauvegarde des paramètres.
                      </AlertDescription>
                    </Alert>
                    
                    <Button onClick={() => setShowSqlFix(!showSqlFix)} variant="outline" className="w-full">
                      {showSqlFix ? 'Masquer le script de correction' : 'Afficher le script SQL de correction RLS'}
                    </Button>

                    {showSqlFix && (
                      <div className="relative group mt-2">
                        <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto text-xs font-mono border border-slate-700">
                          {generateNotificationPrefsSQLFix()}
                        </pre>
                        <div className="text-xs text-muted-foreground mt-2">
                          <strong>Instruction:</strong> Copiez ce code et exécutez-le dans l'éditeur SQL de votre tableau de bord Supabase pour résoudre le problème.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center bg-muted/50 rounded-lg">
                <span className="text-muted-foreground text-sm">En attente des résultats de l'audit...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSecurityAuditPage;