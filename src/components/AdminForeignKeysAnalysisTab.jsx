import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Database, CheckCircle2, AlertTriangle, Copy, FileJson, FileText, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { foreignKeyAnalyzer } from '@/lib/foreignKeyAnalyzer';

export const AdminForeignKeysAnalysisTab = ({ allFks = [], issues = [], isLoading = false }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());

  const stats = foreignKeyAnalyzer.categorizeForeignKeys(allFks);

  const filteredFks = allFks.filter(fk => 
    fk.parent_table.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fk.child_table.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fk.constraint_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié",
      description: "Requête SQL copiée dans le presse-papiers.",
    });
  };

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Analyse des relations en cours...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Database className="h-4 w-4" /> Total Clés Étrangères
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/50 border-emerald-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Configuré avec CASCADE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{stats.ok}</div>
          </CardContent>
        </Card>
        <Card className={stats.missing > 0 ? "bg-red-50/50 border-red-100 shadow-sm" : "bg-white border-border/50 shadow-sm"}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium flex items-center gap-2 ${stats.missing > 0 ? 'text-red-800' : 'text-muted-foreground'}`}>
              <AlertTriangle className="h-4 w-4" /> Bloquant (RESTRICT / NO ACTION)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.missing > 0 ? 'text-red-600' : ''}`}>{stats.missing}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis Table */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Audit Détaillé des Relations</CardTitle>
              <CardDescription>Liste complète des clés étrangères et de leur comportement de suppression.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input 
                placeholder="Rechercher une table..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64"
              />
              <Button variant="outline" size="icon" title="Exporter JSON" onClick={() => foreignKeyAnalyzer.exportData(filteredFks, 'json')}>
                <FileJson className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" title="Exporter CSV" onClick={() => foreignKeyAnalyzer.exportData(filteredFks, 'csv')}>
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 bg-white shadow-sm z-10">
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Table Parente</TableHead>
                  <TableHead>Table Enfant</TableHead>
                  <TableHead>Contrainte</TableHead>
                  <TableHead>Règle Delete</TableHead>
                  <TableHead className="text-right">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune relation trouvée.</TableCell>
                  </TableRow>
                ) : (
                  filteredFks.map((fk) => {
                    const isMissing = fk.status !== 'OK';
                    const issue = issues.find(i => i.constraint_name === fk.constraint_name);
                    const isExpanded = expandedRows.has(fk.constraint_name);
                    
                    return (
                      <React.Fragment key={fk.constraint_name}>
                        <TableRow className={isMissing ? "bg-red-50/20 hover:bg-red-50/40" : "hover:bg-muted/50"}>
                          <TableCell>
                            {isMissing && (
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleRow(fk.constraint_name)}>
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-blue-700">{fk.parent_table} <span className="text-muted-foreground text-xs font-normal">({fk.parent_column})</span></TableCell>
                          <TableCell className="font-medium">{fk.child_table} <span className="text-muted-foreground text-xs font-normal">({fk.child_column})</span></TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{fk.constraint_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={fk.delete_rule === 'CASCADE' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}>
                              {fk.delete_rule}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {isMissing ? (
                              <Badge variant="destructive" className="animate-pulse">Action Requise</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">CASCADE OK</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                        {isExpanded && isMissing && issue && (
                          <TableRow className="bg-slate-50 border-b">
                            <TableCell colSpan={6} className="p-4">
                              <div className="bg-slate-900 rounded-md p-3 relative group">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="absolute top-2 right-2 h-8 text-slate-300 hover:text-white hover:bg-slate-800"
                                  onClick={() => handleCopy(issue.fix_sql)}
                                >
                                  <Copy className="h-4 w-4 mr-2" /> Copier le correctif SQL
                                </Button>
                                <p className="text-xs text-slate-400 mb-2 font-mono uppercase">-- Exécuter dans SQL Editor pour corriger</p>
                                <code className="text-sm font-mono text-green-400 break-all">{issue.fix_sql}</code>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};