import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  Activity, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  TrendingUp 
} from 'lucide-react';
import { checkDatabaseHealth, getHealthHistory, clearHealthCache } from '@/lib/databaseHealthCheck';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function DebugSystemStatus() {
  const isOnline = useNetworkStatus();
  const [dbState, setDbState] = useState({
    status: 'checking', // 'checking', 'connected', 'error', 'timeout'
    latency: null,
    timestamp: null,
    error: null,
    cached: false
  });
  const [history, setHistory] = useState([]);
  const [isRetesting, setIsRetesting] = useState(false);

  const runCheck = async (force = false) => {
    if (force) {
      setIsRetesting(true);
      clearHealthCache();
    }
    
    try {
      const result = await checkDatabaseHealth(force);
      setDbState({
        status: result.status,
        latency: result.latency,
        timestamp: result.timestamp,
        error: result.error,
        cached: result.cached
      });
      setHistory(getHealthHistory());
    } catch (e) {
      console.error("Check failed unexpectedly", e);
    } finally {
      if (force) setIsRetesting(false);
    }
  };

  useEffect(() => {
    runCheck(false); // Initial check (uses cache if available)
    
    // Auto-refresh every 30s
    const interval = setInterval(() => runCheck(false), 30000);
    return () => clearInterval(interval);
  }, []);

  // Latency Color Logic
  const getLatencyColor = (ms) => {
    if (!ms) return "text-gray-400";
    if (ms < 50) return "text-amber-500";
    if (ms < 100) return "text-yellow-500";
    if (ms < 150) return "text-amber-500";
    return "text-red-500";
  };
  
  const getLatencyBadgeVariant = (ms) => {
    if (!ms) return "outline";
    if (ms < 50) return "success"; // Assuming custom variant or default
    if (ms < 100) return "warning";
    if (ms < 150) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Network Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">État Réseau</CardTitle>
            {isOnline ? <Wifi className="h-4 w-4 text-amber-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {isOnline ? 'En Ligne' : 'Hors Ligne'}
              <Badge variant={isOnline ? "outline" : "destructive"} className={cn(isOnline ? "bg-amber-50 text-amber-700 border-amber-200" : "")}>
                {isOnline ? 'Connecté' : 'Déconnecté'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Connexion internet détectée
            </p>
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base de Données</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              Supabase
              {dbState.status === 'connected' && <CheckCircle2 className="h-5 w-5 text-amber-500" />}
              {dbState.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
              {dbState.status === 'timeout' && <Clock className="h-5 w-5 text-amber-500" />}
              {dbState.status === 'checking' && <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dbState.status === 'connected' ? 'Opérationnel' : dbState.status === 'error' ? 'Erreur de connexion' : dbState.status === 'timeout' ? 'Timeout' : 'Vérification...'}
            </p>
          </CardContent>
        </Card>

        {/* Latency Monitor */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latence Query</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold flex items-center gap-2", getLatencyColor(dbState.latency))}>
              {dbState.latency !== null ? `${dbState.latency}ms` : '--'}
              {dbState.latency !== null && (
                <div className="flex space-x-0.5 items-end h-4 ml-2" title="Historique (10 derniers checks)">
                  {history.map((h, i) => {
                    const height = Math.min(100, Math.max(20, (h.latency / 200) * 100)); // Scale for visual
                    const colorClass = h.latency < 50 ? 'bg-green-400' : h.latency < 150 ? 'bg-yellow-400' : 'bg-red-400';
                    return (
                      <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        className={cn("w-1 rounded-t-sm", colorClass)} 
                      />
                    );
                  })}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex justify-between items-center">
              <span>Temps de réponse (Ping)</span>
              {dbState.cached && <span className="text-[10px] bg-secondary px-1 rounded">Cached</span>}
            </p>
          </CardContent>
        </Card>

        {/* Action / Timestamp */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dernier Check</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={() => runCheck(true)}
              disabled={isRetesting}
            >
              <RefreshCw className={cn("h-3 w-3", isRetesting && "animate-spin")} />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">
              {dbState.timestamp ? dbState.timestamp.toLocaleTimeString() : '--:--'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isRetesting ? 'Test en cours...' : 'Cliquer pour re-tester'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Latency Warnings / Tips */}
      {dbState.latency > 100 && (
         <div className="bg-amber-50 dark:bg-orange-950/30 border border-amber-200 dark:border-green-900 rounded-md p-3 flex items-start gap-3">
           <AlertCircle className="h-5 w-5 text-amber-600 dark:text-green-400 mt-0.5 shrink-0" />
           <div>
             <h4 className="font-semibold text-amber-800 dark:text-green-300 text-sm">Latence élevée détectée</h4>
             <p className="text-xs text-amber-700 dark:text-green-400 mt-1">
               La latence de la base de données est supérieure à 100ms. Cela peut affecter l'expérience utilisateur.
               Vérifiez la connexion ou consultez les conseils d'optimisation ci-dessous.
             </p>
           </div>
         </div>
      )}
    </div>
  );
}