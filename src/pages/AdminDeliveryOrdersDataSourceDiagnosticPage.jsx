import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useRealtimeDeliveryOrders } from '@/hooks/useRealtimeDeliveryOrders';
import { supabase } from '@/lib/customSupabaseClient';
import { Database, Search, Activity, Terminal, Server, Play } from 'lucide-react';

export const AdminDeliveryOrdersDataSourceDiagnosticPage = () => {
  const [testId, setTestId] = useState('74565dc7-ea8f-4556-8c45-73701a35b17c');
  const [manualQueryTable, setManualQueryTable] = useState('delivery_orders');
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);

  // Hook details
  const { debugInfo, loading: hookLoading, error: hookError } = useRealtimeDeliveryOrders({
    page: 1, limit: 1
  });

  const executeManualQuery = async () => {
    setQueryLoading(true);
    setQueryResult(null);
    try {
      console.log(`[Diagnostic] Executing SELECT * FROM ${manualQueryTable} WHERE id = '${testId}'`);
      const { data, error } = await supabase.from(manualQueryTable).select('*').eq('id', testId);
      
      setQueryResult({
        table: manualQueryTable,
        executedAt: new Date().toISOString(),
        success: !error,
        count: data ? data.length : 0,
        data: data || [],
        error: error ? error.message : null,
        columns: data && data.length > 0 ? Object.keys(data[0]) : []
      });
    } catch (err) {
      setQueryResult({ success: false, error: err.message, data: [], count: 0, table: manualQueryTable });
    } finally {
      setQueryLoading(false);
    }
  };

  const autoDiagnoseId = async () => {
    setQueryLoading(true);
    const tables = ['delivery_orders', 'orders', 'restaurant_orders', 'order_items'];
    const results = {};
    
    for (const table of tables) {
      const { data } = await supabase.from(table).select('*').eq('id', testId);
      results[table] = data && data.length > 0 ? data : null;
      console.log(`Diagnostic - ${table}:`, data && data.length > 0 ? 'FOUND' : 'NOT FOUND', data);
    }
    
    setQueryResult({
      isAutoTrace: true,
      summary: results
    });
    setQueryLoading(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900">
            <Database className="h-8 w-8 text-indigo-600" /> Delivery Orders Source Diagnostic
          </h1>
          <p className="text-gray-500 mt-1">Identify exact table origins and execute raw Supabase queries</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* Hook State Inspector */}
          <Card className="shadow-md">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Activity className="h-5 w-5 text-blue-500" /> useRealtimeDeliveryOrders State
              </CardTitle>
              <CardDescription>Live inspection of the hook driving the list view</CardDescription>
            </CardHeader>
            <CardContent className="p-4 bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto relative min-h-[300px]">
              {hookLoading && <div className="absolute top-4 right-4 animate-pulse text-blue-400">Loading Hook...</div>}
              {hookError && <div className="text-red-400 mb-4">Error: {hookError}</div>}
              
              {debugInfo && (
                <div className="space-y-4">
                  <div><span className="text-blue-400 font-bold">Base Table:</span> {debugInfo.tableName}</div>
                  <div><span className="text-blue-400 font-bold">Primary Key:</span> {debugInfo.primaryKey}</div>
                  <div><span className="text-blue-400 font-bold">Has Joins:</span> {debugInfo.hasJoins ? 'YES' : 'NO'}</div>
                  
                  <div>
                    <span className="text-purple-400 font-bold">Exact SQL Select Query:</span>
                    <pre className="mt-1 p-2 bg-slate-900 rounded border border-slate-800 text-[10px] whitespace-pre-wrap">
                      {debugInfo.queryConfig?.select}
                    </pre>
                  </div>
                  <div>
                    <span className="text-yellow-400 font-bold">Sample Data (1 row):</span>
                    <pre className="mt-1 p-2 bg-slate-900 rounded border border-slate-800 text-[10px] max-h-40 overflow-y-auto">
                      {debugInfo.rawResponse && debugInfo.rawResponse.length > 0 
                        ? JSON.stringify(debugInfo.rawResponse[0], null, 2) 
                        : 'No Data Returned'}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Query Tester */}
          <Card className="shadow-md">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Terminal className="h-5 w-5 text-teal-500" /> Diagnostic Query Runner
              </CardTitle>
              <CardDescription>Execute queries to find which table contains a specific ID</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Target ID to Find</label>
                <Input value={testId} onChange={(e) => setTestId(e.target.value)} className="font-mono text-sm" />
              </div>
              
              <div className="flex gap-2 items-end">
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-slate-700">Table Name</label>
                  <select 
                    value={manualQueryTable}
                    onChange={(e) => setManualQueryTable(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="delivery_orders">delivery_orders</option>
                    <option value="orders">orders</option>
                    <option value="restaurant_orders">restaurant_orders</option>
                    <option value="order_items">order_items</option>
                  </select>
                </div>
                <Button onClick={executeManualQuery} disabled={queryLoading} className="bg-teal-600 hover:bg-teal-700">
                  <Play className="h-4 w-4 mr-2" /> Run Query
                </Button>
                <Button onClick={autoDiagnoseId} disabled={queryLoading} variant="outline" className="border-indigo-200 text-indigo-700">
                  <Search className="h-4 w-4 mr-2" /> Auto Trace All
                </Button>
              </div>

              {queryResult && !queryResult.isAutoTrace && (
                <div className="mt-4 border rounded-md overflow-hidden">
                  <div className={`p-3 text-sm font-bold border-b flex justify-between ${queryResult.success && queryResult.count > 0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-700'}`}>
                    <span>Result: {queryResult.count} row(s) found</span>
                    <Badge variant={queryResult.count > 0 ? "default" : "secondary"}>
                      Table: {queryResult.table}
                    </Badge>
                  </div>
                  <ScrollArea className="h-64 bg-slate-950 p-4">
                    <pre className="text-xs text-green-400 font-mono">
                      {JSON.stringify(queryResult.data, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}

              {queryResult && queryResult.isAutoTrace && (
                <div className="mt-4 space-y-3">
                  <h3 className="font-bold text-sm">Trace Results for ID: {testId}</h3>
                  {Object.entries(queryResult.summary).map(([table, data]) => (
                    <div key={table} className={`p-3 rounded border text-sm ${data ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex justify-between font-bold mb-2">
                        <span className="font-mono">{table}</span>
                        {data ? (
                          <span className="text-amber-600 bg-amber-100 px-2 rounded-full text-xs">FOUND</span>
                        ) : (
                          <span className="text-slate-400">Not Found</span>
                        )}
                      </div>
                      {data && (
                        <pre className="text-[10px] bg-white p-2 rounded max-h-32 overflow-y-auto font-mono border">
                          {JSON.stringify(data[0], null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDeliveryOrdersDataSourceDiagnosticPage;