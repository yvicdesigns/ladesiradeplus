import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Clock, AlertTriangle, RefreshCw, Download } from 'lucide-react';
import { queryMonitor } from '@/lib/queryPerformanceMonitor';

export const AdminPerformanceMonitorTab = () => {
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, timeouts: 0, errors: 0, avgDuration: 0 });

  useEffect(() => {
    // Initial load
    setLogs(queryMonitor.getLogs());
    setMetrics(queryMonitor.getMetrics());

    // Subscribe to real-time updates
    const unsubscribe = queryMonitor.subscribe((newLogs, newMetrics) => {
      setLogs([...newLogs]);
      setMetrics(newMetrics);
    });

    return () => unsubscribe();
  }, []);

  const handleClear = () => {
    queryMonitor.clear();
  };

  const getStatusColor = (status) => {
    if (status === 'timeout') return 'bg-amber-500';
    if (status === 'error') return 'bg-red-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performances & Requêtes</h2>
          <p className="text-muted-foreground text-sm">Moniteur en temps réel des requêtes Supabase et des délais d'attente (Timeouts).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleClear} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Vider
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
              Requêtes Totales <Activity className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{metrics.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
              Temps Moyen (ms) <Clock className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-blue-600">{metrics.avgDuration}ms</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
              Timeouts <AlertTriangle className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className={`text-2xl font-bold ${metrics.timeouts > 0 ? 'text-amber-500' : 'text-slate-700'}`}>
              {metrics.timeouts}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
              Erreurs <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className={`text-2xl font-bold ${metrics.errors > 0 ? 'text-red-500' : 'text-slate-700'}`}>
              {metrics.errors}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Journal des requêtes (Dernières {logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            {logs.length === 0 ? (
              <div className="text-center py-10 text-slate-500">Aucune requête enregistrée.</div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{log.queryName}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()} 
                        {log.error && <span className="text-red-500 ml-2 block truncate max-w-xs">{log.error}</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 md:mt-0">
                      <span className="text-sm font-mono">{log.durationMs}ms</span>
                      <Badge className={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};