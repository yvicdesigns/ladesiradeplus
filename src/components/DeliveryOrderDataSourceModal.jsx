import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, Database, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const DeliveryOrderDataSourceModal = ({ open, onClose, results, loading, error }) => {
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col overflow-hidden bg-slate-50">
        <DialogHeader className="shrink-0 bg-white p-4 border-b -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="flex items-center gap-2 text-xl text-indigo-900">
            <Database className="h-6 w-6 text-indigo-600" /> 
            Data Source Diagnostic Results
          </DialogTitle>
          <DialogDescription>
            Deep inspection of order data across core tables to identify the true origin.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p>Executing diagnostic queries directly against Supabase...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Diagnostic Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && results && (
            <div className="space-y-6">
              {/* SUMMARY SECTION */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-3 border-b pb-2">Diagnostic Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Target ID Evaluated:</p>
                    <code className="bg-slate-100 text-indigo-600 px-2 py-1 rounded font-bold text-sm">
                      {results.summary.targetId}
                    </code>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">ID Found In Tables:</p>
                    {results.summary.containingTables.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {results.summary.containingTables.map(t => (
                          <Badge key={t} className="bg-amber-500 hover:bg-green-600 font-mono">✅ {t}</Badge>
                        ))}
                      </div>
                    ) : (
                      <Badge variant="destructive">Not found in targeted tables</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* TABS SECTION */}
              <Tabs defaultValue="q1" className="w-full">
                <TabsList className="w-full justify-start h-auto flex-wrap bg-white border border-slate-200 p-1">
                  <TabsTrigger value="q1" className="text-xs data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Q1: Delivery Orders (Target)</TabsTrigger>
                  <TabsTrigger value="q2" className="text-xs data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Q2: Orders (Target)</TabsTrigger>
                  <TabsTrigger value="q3" className="text-xs data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Q3: Restaurant Orders (Target)</TabsTrigger>
                  <TabsTrigger value="q4" className="text-xs data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Q4: Delivery Orders (Schema)</TabsTrigger>
                  <TabsTrigger value="q5" className="text-xs data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Q5: Orders (Schema)</TabsTrigger>
                </TabsList>

                {Object.entries(results.queries).map(([key, queryInfo]) => (
                  <TabsContent key={key} value={key} className="mt-4">
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      
                      <div className="bg-slate-900 text-slate-300 p-4 border-b border-slate-800 flex justify-between items-center">
                        <div className="font-mono text-sm break-all pr-4">
                          <span className="text-green-400 font-bold">SQL: </span> {queryInfo.name}
                        </div>
                        <Badge variant="outline" className="text-slate-300 border-slate-600 whitespace-nowrap">
                          {queryInfo.count} Row(s)
                        </Badge>
                      </div>

                      {queryInfo.error && (
                        <div className="p-4 bg-red-50 text-red-700 border-b border-red-100 text-sm font-mono">
                          Error: {queryInfo.error}
                        </div>
                      )}

                      <div className="p-4 bg-slate-50 border-b border-slate-100">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Returned Columns ({queryInfo.columns.length})</h4>
                        <div className="flex flex-wrap gap-1">
                          {queryInfo.columns.length > 0 ? (
                            queryInfo.columns.map(col => (
                              <span key={col} className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-mono">
                                {col}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-slate-400 italic">No columns returned</span>
                          )}
                        </div>
                      </div>

                      <div className="relative p-0">
                        <div className="absolute top-2 right-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs bg-slate-800 text-slate-200 hover:bg-slate-700 border-none"
                            onClick={() => handleCopy(JSON.stringify(queryInfo.data, null, 2), key)}
                            disabled={!queryInfo.data || queryInfo.data.length === 0}
                          >
                            {copiedKey === key ? <Check className="h-3 w-3 mr-1 text-green-400" /> : <Copy className="h-3 w-3 mr-1" />}
                            {copiedKey === key ? 'Copied!' : 'Copy JSON'}
                          </Button>
                        </div>
                        <pre className="p-4 bg-[#1e1e1e] text-[#d4d4d4] text-xs font-mono overflow-auto max-h-[400px] m-0 custom-scrollbar">
                          {queryInfo.data && queryInfo.data.length > 0 
                            ? JSON.stringify(queryInfo.data, null, 2) 
                            : '// No data returned'}
                        </pre>
                      </div>

                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};