import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useDebugLogs } from '@/hooks/useDebugLogs';
import { Download, Trash2, Search, Filter } from 'lucide-react';

export function DebugLogsPanel() {
  const { logs, filters, setFilters, clearLogs, exportLogs, LOG_EVENTS } = useDebugLogs();

  const getLevelColor = (level) => {
    switch(level) {
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'warn': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'success': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Logs Système</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button variant="destructive" size="sm" onClick={clearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Effacer
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher dans les logs..." 
              className="pl-8"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          
          <Select 
            value={filters.type} 
            onValueChange={(val) => setFilters(prev => ({ ...prev, type: val }))}
          >
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les types</SelectItem>
              {Object.values(LOG_EVENTS).map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.level} 
            onValueChange={(val) => setFilters(prev => ({ ...prev, level: val }))}
          >
            <SelectTrigger className="w-[150px]">
              <div className={`h-3 w-3 rounded-full mr-2 ${
                filters.level === 'error' ? 'bg-red-500' : 
                filters.level === 'warn' ? 'bg-amber-500' : 
                'bg-slate-500'
              }`} />
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous niveaux</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warn">Avertissement</SelectItem>
              <SelectItem value="error">Erreur</SelectItem>
              <SelectItem value="success">Succès</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full rounded-md border p-4 bg-slate-50">
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Aucun log à afficher pour ces critères.
              </div>
            ) : (
              logs.map((log) => (
                <div 
                  key={log.id} 
                  className="bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getLevelColor(log.level)}>
                        {log.level.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                        {log.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}.{new Date(log.timestamp).getMilliseconds()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{log.message}</p>
                  {log.details && (
                    <pre className="mt-2 text-xs bg-slate-900 text-slate-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}