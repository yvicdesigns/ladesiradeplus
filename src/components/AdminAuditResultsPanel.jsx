import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, AlertTriangle, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { downloadAsJSON, downloadAsCSV } from '@/lib/auditReportGenerator';
import { motion } from 'framer-motion';

export const AdminAuditResultsPanel = ({ results, onRetest }) => {
  if (!results || results.length === 0) return null;

  const summary = {
    total: results.length,
    passed: results.filter(r => r.status === 'pass').length,
    warnings: results.filter(r => r.status === 'warning').length,
    failed: results.filter(r => r.status === 'fail').length,
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-5 h-5 text-amber-500" />;
      case 'fail': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return null;
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critique': return <Badge variant="destructive">Critique</Badge>;
      case 'Majeur': return <Badge className="bg-amber-500 hover:bg-green-600">Majeur</Badge>;
      case 'Mineur': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Mineur</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-gray-900">{summary.total}</span>
            <span className="text-sm text-gray-500 mt-1">Tests Totaux</span>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-amber-600">{summary.passed}</span>
            <span className="text-sm text-amber-700 mt-1">Succès</span>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-yellow-600">{summary.warnings}</span>
            <span className="text-sm text-yellow-700 mt-1">Avertissements</span>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-red-600">{summary.failed}</span>
            <span className="text-sm text-red-700 mt-1">Échecs</span>
          </CardContent>
        </Card>
      </div>

      {/* Export & Actions */}
      <div className="flex flex-wrap gap-3 justify-end">
        <Button variant="outline" onClick={() => downloadAsJSON(results)} className="gap-2">
          <FileJson className="w-4 h-4" /> JSON
        </Button>
        <Button variant="outline" onClick={() => downloadAsCSV(results)} className="gap-2">
          <FileSpreadsheet className="w-4 h-4" /> CSV
        </Button>
        <Button onClick={onRetest} className="gap-2">
           Relancer l'Audit
        </Button>
      </div>

      {/* Detailed Results List */}
      <Card>
        <CardHeader>
          <CardTitle>Résultats Détaillés</CardTitle>
          <CardDescription>Analyse complète des modules de l'application</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {results.map((result, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={result.id} 
                  className={`p-4 rounded-xl border ${
                    result.status === 'pass' ? 'border-green-100 bg-amber-50/30' : 
                    result.status === 'fail' ? 'border-red-200 bg-red-50/30' : 
                    'border-yellow-200 bg-yellow-50/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0">
                      {getStatusIcon(result.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-bold text-gray-900">{result.title}</h4>
                        {getSeverityBadge(result.severity)}
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-2">{result.message}</p>
                      
                      {result.details && (
                        <div className="bg-white/60 p-2 rounded-md border border-gray-100 mb-3">
                          <p className="text-xs font-mono text-gray-600 break-words">{result.details}</p>
                        </div>
                      )}

                      {result.suggestions && result.suggestions.length > 0 && (
                        <div className="mt-3">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Suggestions de correction :</span>
                          <ul className="list-disc pl-4 mt-1 space-y-1">
                            {result.suggestions.map((s, i) => (
                              <li key={i} className="text-sm text-gray-700">{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};