import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Terminal, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export const RobustnessAuditRecommendationsPanel = ({ auditData }) => {
  const [selectedIssue, setSelectedIssue] = useState(null);

  const recommendations = useMemo(() => {
    if (!auditData) return [];
    let list = [];
    auditData.categoryResults.forEach(cat => {
      cat.issues.forEach(issue => {
        list.push({ ...issue, category: cat.category });
      });
    });
    
    // Sort prioritizing Critique
    const severityWeight = { 'Critique': 3, 'Majeur': 2, 'Mineur': 1 };
    list.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);
    
    return list.slice(0, 10); // Top 10 priority fixes
  }, [auditData]);

  const handleTraiterClick = (rec) => {
    setSelectedIssue(rec);
  };

  const getLogs = (issue) => {
    if (!issue) return null;
    // Attempt to extract logs from various possible structures in the audit data
    const logs = issue.console_logs || issue.logs || issue.details?.console_logs || issue.details?.logs;
    
    if (Array.isArray(logs)) return logs;
    if (typeof logs === 'string') return logs.split('\n');
    
    // Fallback if details exist but no explicit logs array
    if (issue.details && typeof issue.details === 'object') {
       return [JSON.stringify(issue.details, null, 2)];
    }
    
    return null;
  };

  if (!auditData || recommendations.length === 0) return null;

  const renderIssueDetails = () => {
    if (!selectedIssue) return null;
    const logs = getLogs(selectedIssue);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={selectedIssue.severity === 'Critique' ? 'destructive' : selectedIssue.severity === 'Majeur' ? 'default' : 'secondary'} className={selectedIssue.severity === 'Majeur' ? 'bg-amber-500' : ''}>
            {selectedIssue.severity}
          </Badge>
          <Badge variant="outline">{selectedIssue.category}</Badge>
        </div>
        
        <div>
          <h4 className="font-semibold text-sm mb-1">Description du problème</h4>
          <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border">
            {selectedIssue.description || "Aucune description détaillée fournie."}
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-1 text-amber-700">Recommandation</h4>
          <p className="text-sm text-amber-800 bg-amber-50/50 p-3 rounded-md border border-green-100">
            {selectedIssue.recommendation || "Aucune recommandation spécifique."}
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Terminal className="w-4 h-4" /> Logs & Détails Techniques
          </h4>
          {logs && logs.length > 0 ? (
            <ScrollArea className="h-[250px] w-full rounded-md border bg-slate-950 p-4">
              <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap break-words">
                {logs.map((log, i) => (
                  <div key={i} className="mb-1 border-b border-slate-800 pb-1">{log}</div>
                ))}
              </pre>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 border rounded-md border-dashed bg-muted/10 text-muted-foreground">
              <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Aucun log technique ou trace de console disponible pour ce problème.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="bg-primary/5 pb-4">
          <CardTitle className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="w-5 h-5" /> Plan d'Action Prioritaire
          </CardTitle>
          <CardDescription>Top {recommendations.length} recommandations pour stabiliser l'application avant publication.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {recommendations.map((rec, idx) => (
              <div key={rec.id || idx} className="flex gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0
                  ${rec.severity === 'Critique' ? 'bg-red-100 text-red-700' : 
                    rec.severity === 'Majeur' ? 'bg-amber-100 text-amber-700' : 
                    'bg-yellow-100 text-yellow-700'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-foreground truncate mb-1">{rec.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{rec.recommendation}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                     <span className="text-xs font-medium text-muted-foreground">{rec.category}</span>
                     <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs text-primary gap-1 px-2 hover:bg-primary/10"
                        onClick={() => handleTraiterClick(rec)}
                     >
                       Traiter <ArrowRight className="w-3 h-3" />
                     </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedIssue} onOpenChange={(open) => !open && setSelectedIssue(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg pr-6">{selectedIssue?.title}</DialogTitle>
            <DialogDescription>
              Détails de l'anomalie détectée lors de l'audit.
            </DialogDescription>
          </DialogHeader>
          
          {renderIssueDetails()}
          
          <div className="flex justify-end pt-4 mt-2 border-t">
            <Button variant="outline" onClick={() => setSelectedIssue(null)}>Fermer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};