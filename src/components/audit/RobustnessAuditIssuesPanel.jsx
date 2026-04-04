import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const RobustnessAuditIssuesPanel = ({ auditData }) => {
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const allIssues = useMemo(() => {
    if (!auditData) return [];
    let list = [];
    auditData.categoryResults.forEach(cat => {
      cat.issues.forEach(issue => {
        list.push({ ...issue, category: cat.category });
      });
    });
    
    // Sort logic: Critique > Majeur > Mineur
    const severityWeight = { 'Critique': 3, 'Majeur': 2, 'Mineur': 1 };
    list.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);
    
    return list;
  }, [auditData]);

  const filteredIssues = useMemo(() => {
    if (!filter) return allIssues;
    const lowerFilter = filter.toLowerCase();
    return allIssues.filter(i => 
      i.title.toLowerCase().includes(lowerFilter) || 
      i.category.toLowerCase().includes(lowerFilter) ||
      i.description.toLowerCase().includes(lowerFilter)
    );
  }, [allIssues, filter]);

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critique': return <Badge variant="destructive" className="gap-1"><AlertOctagon className="w-3 h-3"/> Critique</Badge>;
      case 'Majeur': return <Badge className="bg-amber-500 hover:bg-green-600 gap-1"><AlertTriangle className="w-3 h-3"/> Majeur</Badge>;
      case 'Mineur': return <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50 gap-1"><Info className="w-3 h-3"/> Mineur</Badge>;
      default: return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  if (!auditData) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Journal des Problèmes ({allIssues.length})</CardTitle>
            <CardDescription>Liste complète des anomalies détectées lors de l'audit.</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrer..."
              className="pl-8"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">Sévérité</TableHead>
                <TableHead className="w-[150px]">Catégorie</TableHead>
                <TableHead>Titre du problème</TableHead>
                <TableHead className="text-right w-[100px]">Détails</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucun problème trouvé ou correspondant au filtre.</TableCell>
                </TableRow>
              ) : (
                filteredIssues.map((issue) => (
                  <React.Fragment key={issue.id}>
                    <TableRow className={`cursor-pointer hover:bg-muted/50 ${expandedId === issue.id ? 'bg-muted/30' : ''}`} onClick={() => setExpandedId(expandedId === issue.id ? null : issue.id)}>
                      <TableCell>{getSeverityBadge(issue.severity)}</TableCell>
                      <TableCell className="font-medium text-xs text-muted-foreground">{issue.category}</TableCell>
                      <TableCell className="font-semibold text-sm">{issue.title}</TableCell>
                      <TableCell className="text-right text-xs text-primary">{expandedId === issue.id ? 'Fermer' : 'Voir plus'}</TableCell>
                    </TableRow>
                    <AnimatePresence>
                      {expandedId === issue.id && (
                        <TableRow>
                          <TableCell colSpan={4} className="p-0 border-b">
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="bg-muted/10 p-4 border-l-4 border-primary/50"
                            >
                              <div className="space-y-3 pl-4">
                                <div>
                                  <span className="text-xs font-bold uppercase text-muted-foreground">ID du Test : </span>
                                  <span className="text-xs font-mono bg-background px-2 py-0.5 rounded border">{issue.id}</span>
                                </div>
                                <div>
                                  <span className="text-sm font-bold block mb-1">Description :</span>
                                  <p className="text-sm text-muted-foreground">{issue.description}</p>
                                </div>
                                <div className="bg-amber-50/50 border border-green-100 p-3 rounded-md">
                                  <span className="text-sm font-bold block mb-1 text-amber-800">Recommandation :</span>
                                  <p className="text-sm text-amber-700">{issue.recommendation}</p>
                                </div>
                              </div>
                            </motion.div>
                          </TableCell>
                        </TableRow>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};