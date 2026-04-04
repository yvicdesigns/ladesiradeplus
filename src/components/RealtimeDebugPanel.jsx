import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Database, RefreshCw, XCircle, Minimize2, Maximize2, Zap, WifiOff } from 'lucide-react';
import { realtimeHealthCheck } from '@/lib/RealtimeHealthCheck';
import { pollingService } from '@/lib/PollingService';

export const RealtimeDebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [healthStatus, setHealthStatus] = useState(realtimeHealthCheck.getHealthStatus());
  const [pollingStatus, setPollingStatus] = useState({});

  useEffect(() => {
    const unsub = realtimeHealthCheck.subscribeToStatusChanges(({ data }) => setHealthStatus(data));
    const interval = setInterval(() => {
      setPollingStatus(pollingService.getPollingStatus());
      setHealthStatus(realtimeHealthCheck.getHealthStatus()); // Force refresh latency
    }, 1000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const simulateDisconnect = () => realtimeHealthCheck.simulateDisconnection(8000);

  if (!isOpen) {
    return (
      <Button 
        variant="default" 
        size="sm" 
        className="fixed bottom-4 right-4 z-[100] shadow-2xl gap-2 text-xs bg-slate-900 border border-cyan-500/50 hover:bg-slate-800 text-cyan-50"
        onClick={() => setIsOpen(true)}
      >
        <Activity className="h-3 w-3 text-cyan-400" />
        <span className="font-mono">DEBUG</span>
        <div className={`w-2 h-2 rounded-full ${healthStatus.isHealthy ? 'bg-amber-500' : 'bg-red-500'}`} />
      </Button>
    );
  }

  if (isMinimized) {
    return (
      <Card className="fixed bottom-4 right-4 z-[100] w-72 shadow-2xl border-2 border-cyan-500/30 bg-slate-900 text-slate-100">
        <div className="p-3 flex items-center justify-between">
           <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold font-mono">MONITOR</span>
            <div className={`w-2 h-2 rounded-full ${healthStatus.isHealthy ? 'bg-amber-500' : 'bg-red-500'}`} />
          </div>
          <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400" onClick={() => setIsMinimized(false)}>
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-[100] w-96 shadow-2xl border-2 border-cyan-500 bg-slate-950/95 text-slate-200 flex flex-col font-mono text-xs">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <CardTitle className="text-sm font-bold text-cyan-100 tracking-wider">DEV MONITOR</CardTitle>
          <div className={`w-2 h-2 rounded-full ${healthStatus.isHealthy ? 'bg-amber-500' : 'bg-red-500'}`} />
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400" onClick={() => setIsMinimized(true)}>
            <Minimize2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400" onClick={() => setIsOpen(false)}>
            <XCircle className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 overflow-y-auto max-h-[70vh]">
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-cyan-500 mb-2 border-b border-slate-800 pb-1">System Health</h4>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>Status: <span className={healthStatus.isHealthy ? 'text-green-400' : 'text-red-400'}>{healthStatus.status}</span></div>
              <div>Latency: <span className="text-yellow-400">{healthStatus.latency}ms</span></div>
              <div>Score: <span className="text-blue-400">{healthStatus.score}/100</span></div>
              <div>Failures: <span className="text-red-400">{healthStatus.failureCount}</span></div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-cyan-500 mb-2 border-b border-slate-800 pb-1">Active Polling Tasks</h4>
            {Object.keys(pollingStatus).length === 0 ? (
              <span className="text-[10px] text-slate-500">No active polling tasks</span>
            ) : (
              <div className="space-y-1">
                {Object.entries(pollingStatus).map(([key, task]) => (
                  <div key={key} className="flex justify-between items-center text-[10px] bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-300">{key}</span>
                    <Badge variant="outline" className={`h-4 text-[8px] ${task.inFlight ? 'bg-yellow-500/20 text-yellow-400' : 'bg-amber-500/20 text-green-400'}`}>
                      {task.interval}ms
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
             <Button 
                onClick={simulateDisconnect} 
                size="sm" 
                variant="destructive" 
                className="w-full text-xs h-7"
                disabled={healthStatus.simulatedFailure}
             >
                <WifiOff className="w-3 h-3 mr-2" /> Simulate Disconnect (8s)
             </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};