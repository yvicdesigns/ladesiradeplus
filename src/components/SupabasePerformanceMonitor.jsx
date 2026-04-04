import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getSupabaseLatency } from '@/lib/supabaseMonitorUtils';
import { Activity, Database, Server, Wifi } from 'lucide-react';
import { getNetworkStatus } from '@/lib/networkResilience';

export const SupabasePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    latency: 0,
    status: 'checking',
    hitRate: 0,
    requests: 0
  });

  const check = async () => {
    const { latency, ok } = await getSupabaseLatency();
    const net = getNetworkStatus();
    
    setMetrics(prev => ({
      ...prev,
      latency: latency || prev.latency,
      status: !ok ? 'error' : (net.isOffline ? 'offline' : (latency > 300 ? 'slow' : 'good')),
      requests: prev.requests + 1
    }));
  };

  useEffect(() => {
    const interval = setInterval(check, 10000);
    check();
    return () => clearInterval(interval);
  }, []);

  // Fixed: Replaced process.env.NODE_ENV with import.meta.env.DEV for Vite compatibility
  if (!import.meta.env.DEV && !window.location.search.includes('debug')) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-2xl z-50 bg-background/95 backdrop-blur border-l-4 border-l-primary">
      <CardHeader className="py-2 px-4 border-b">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
           <Activity className="h-4 w-4" /> Performance DB
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Latence</span>
            <Badge variant={metrics.latency < 200 ? 'outline' : 'destructive'} className={metrics.latency < 200 ? 'text-amber-600 border-amber-200' : ''}>
                {metrics.latency || '--'} ms
            </Badge>
        </div>
        
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span>Santé Connexion</span>
                <span className={metrics.status === 'good' ? 'text-amber-500' : 'text-amber-500'}>
                    {metrics.status.toUpperCase()}
                </span>
            </div>
            <Progress value={metrics.status === 'good' ? 100 : (metrics.status === 'slow' ? 50 : 10)} className="h-1.5" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-2">
            <div className="flex items-center gap-1"><Wifi className="h-3 w-3"/> {metrics.status === 'offline' ? 'Offline' : 'Online'}</div>
            <div className="flex items-center gap-1"><Database className="h-3 w-3"/> Region: Auto</div>
        </div>
      </CardContent>
    </Card>
  );
};