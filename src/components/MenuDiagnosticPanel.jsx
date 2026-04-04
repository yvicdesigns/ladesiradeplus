import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const MenuDiagnosticPanel = ({ currentItemsCount, currentCategoriesCount, fetchCount }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [lastRun, setLastRun] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('--- STARTING MENU DATA DIAGNOSTIC ---');
      
      // 1. Fetch all items
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('id, name, category_id, is_deleted')
        .eq('is_deleted', false);
        
      if (itemsError) throw itemsError;

      // 2. Fetch all categories
      const { data: categories, error: catError } = await supabase
        .from('menu_categories')
        .select('id, name, is_deleted')
        .eq('is_deleted', false);
        
      if (catError) throw catError;

      // 3. Analyze
      const totalItems = items.length;
      const totalCategories = categories.length;
      const categoryIds = new Set(categories.map(c => c.id));
      
      let nullCategoryCount = 0;
      let orphanedCount = 0;
      const itemsPerCategory = {};
      const orphanedItems = [];
      const nullCategoryItems = [];

      items.forEach(item => {
        if (!item.category_id) {
          nullCategoryCount++;
          nullCategoryItems.push(item);
          itemsPerCategory['NULL_OR_MISSING'] = (itemsPerCategory['NULL_OR_MISSING'] || 0) + 1;
        } else if (!categoryIds.has(item.category_id)) {
          orphanedCount++;
          orphanedItems.push(item);
          itemsPerCategory['ORPHANED'] = (itemsPerCategory['ORPHANED'] || 0) + 1;
        } else {
          itemsPerCategory[item.category_id] = (itemsPerCategory[item.category_id] || 0) + 1;
        }
      });

      const summary = {
        totalItems,
        totalCategories,
        nullCategoryCount,
        orphanedCount,
        categoryBreakdown: itemsPerCategory,
        orphanedItems: orphanedItems.slice(0, 5), // sample
        nullCategoryItems: nullCategoryItems.slice(0, 5) // sample
      };

      console.log('Diagnostic Summary:', summary);
      console.log('All unique category_ids in products:', Object.keys(itemsPerCategory));
      console.log('--- END MENU DATA DIAGNOSTIC ---');

      setReport(summary);
      setLastRun(new Date().toISOString());
    } catch (err) {
      console.error('Diagnostic error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Run once on mount if open
    if (isOpen && !report) {
      runDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) {
    return (
      <div className="fixed bottom-20 left-4 z-50">
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-gray-900 text-white border-gray-700 hover:bg-gray-800 shadow-lg text-xs"
          onClick={() => setIsOpen(true)}
        >
          <AlertCircle className="w-3 h-3 mr-2" />
          Menu Diagnostics
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-20 left-4 z-50 w-80 shadow-2xl border-amber-200 bg-white max-h-[80vh] flex flex-col">
      <CardHeader className="py-3 px-4 bg-amber-50 border-b flex flex-row items-center justify-between sticky top-0">
        <CardTitle className="text-sm font-bold flex items-center text-amber-800">
          <AlertCircle className="w-4 h-4 mr-2" /> Data Diagnostics
        </CardTitle>
        <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={runDiagnostics} disabled={loading}>
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
              ✕
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 text-xs overflow-y-auto">
        
        <div className="mb-4 bg-gray-50 p-2 rounded-md border border-gray-100">
            <h4 className="font-bold text-gray-700 mb-1 border-b pb-1">Live Component State</h4>
            <div className="grid grid-cols-2 gap-2 mt-2">
                <div>Items: <span className="font-mono font-bold text-blue-600">{currentItemsCount}</span></div>
                <div>Categories: <span className="font-mono font-bold text-blue-600">{currentCategoriesCount}</span></div>
                <div>Render/Fetch: <span className="font-mono font-bold text-purple-600">{fetchCount}</span></div>
            </div>
        </div>

        {error && <div className="text-red-500 bg-red-50 p-2 rounded mb-2 border border-red-100">{error}</div>}
        
        {!report && !loading && <div className="text-gray-500 text-center py-4">Click refresh to run database diagnostic</div>}
        {loading && !report && <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>}

        {report && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">DB Integrity Status:</span>
                {(report.nullCategoryCount === 0 && report.orphanedCount === 0) ? (
                    <span className="flex items-center text-amber-600"><CheckCircle2 className="w-3 h-3 mr-1"/> Healthy</span>
                ) : (
                    <span className="flex items-center text-red-600"><AlertCircle className="w-3 h-3 mr-1"/> Issues Found</span>
                )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded border border-slate-200">
              <div>DB Items: <b>{report.totalItems}</b></div>
              <div>DB Categories: <b>{report.totalCategories}</b></div>
              <div className={report.nullCategoryCount > 0 ? "text-red-600 font-bold" : ""}>Null Categories: <b>{report.nullCategoryCount}</b></div>
              <div className={report.orphanedCount > 0 ? "text-red-600 font-bold" : ""}>Orphaned Items: <b>{report.orphanedCount}</b></div>
            </div>

            {report.nullCategoryCount > 0 && (
                <div className="bg-red-50 p-2 rounded border border-red-100">
                    <span className="font-bold text-red-700">Samples w/ Null Category:</span>
                    <ul className="list-disc pl-4 mt-1 text-red-600">
                        {report.nullCategoryItems.map(i => <li key={i.id} className="truncate">{i.name}</li>)}
                    </ul>
                </div>
            )}

            {report.orphanedCount > 0 && (
                <div className="bg-amber-50 p-2 rounded border border-green-100">
                    <span className="font-bold text-amber-700">Samples w/ Orphaned Category:</span>
                    <ul className="list-disc pl-4 mt-1 text-amber-600">
                        {report.orphanedItems.map(i => <li key={i.id} className="truncate">{i.name} ({i.category_id})</li>)}
                    </ul>
                </div>
            )}

            <div className="text-[10px] text-gray-400 text-right">
                Last checked: {new Date(lastRun).toLocaleTimeString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};