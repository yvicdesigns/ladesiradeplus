import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TEST_STATUS, TEST_CATEGORIES } from '@/lib/testDefinitions';
import { CheckCircle2, XCircle, AlertTriangle, CircleDashed, ChevronRight, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const StatusIcon = ({ status }) => {
  switch (status) {
    case TEST_STATUS.PASS: return <CheckCircle2 className="w-5 h-5 text-amber-500" />;
    case TEST_STATUS.FAIL: return <XCircle className="w-5 h-5 text-red-500" />;
    case TEST_STATUS.WARNING: return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    default: return <CircleDashed className="w-5 h-5 text-gray-300" />;
  }
};

export const TestCasesList = ({ tests, results, onRunTest }) => {
  // Group tests by category
  const grouped = useMemo(() => {
    const map = {};
    TEST_CATEGORIES.forEach(cat => map[cat] = []);
    tests.forEach(t => {
      if (!map[t.category]) map[t.category] = [];
      map[t.category].push(t);
    });
    return map;
  }, [tests]);

  return (
    <div className="space-y-8">
      {TEST_CATEGORIES.map(category => {
        const catTests = grouped[category];
        if (!catTests || catTests.length === 0) return null;

        // Calculate progress for category
        const catTotal = catTests.length;
        const catRun = catTests.filter(t => results[t.id]?.status && results[t.id]?.status !== TEST_STATUS.NOT_RUN).length;
        const isComplete = catTotal > 0 && catTotal === catRun;

        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {category}
                {isComplete && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
              </h2>
              <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {catRun} / {catTotal}
              </span>
            </div>

            <div className="grid gap-3">
              {catTests.map(test => {
                const result = results[test.id] || { status: TEST_STATUS.NOT_RUN };
                const isRun = result.status !== TEST_STATUS.NOT_RUN;

                return (
                  <Card 
                    key={test.id} 
                    className={cn(
                      "transition-all duration-200 border-l-4 overflow-hidden group hover:shadow-md cursor-pointer",
                      result.status === TEST_STATUS.PASS ? "border-l-green-500 bg-amber-50/10" :
                      result.status === TEST_STATUS.FAIL ? "border-l-red-500 bg-red-50/30" :
                      result.status === TEST_STATUS.WARNING ? "border-l-yellow-500 bg-yellow-50/20" :
                      "border-l-gray-200 hover:border-l-gray-300"
                    )}
                    onClick={() => onRunTest(test)}
                  >
                    <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="mt-1 flex-shrink-0">
                          <StatusIcon status={result.status} />
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-xs font-mono font-bold text-gray-500">{test.id}</span>
                              <h3 className="font-bold text-base text-gray-900 truncate">{test.name}</h3>
                           </div>
                           <p className="text-sm text-gray-600 line-clamp-1 group-hover:line-clamp-none transition-all">{test.description}</p>
                           
                           {isRun && result.notes && (
                             <div className="mt-2 text-xs bg-white border border-gray-100 p-2 rounded text-gray-700 italic border-l-2 border-l-gray-400">
                               "{result.notes}"
                             </div>
                           )}
                           {isRun && result.timestamp && (
                             <div className="mt-2 text-[10px] text-gray-400">
                               Testé le {new Date(result.timestamp).toLocaleString()}
                             </div>
                           )}
                        </div>
                      </div>

                      <div className="flex-shrink-0 hidden sm:flex items-center">
                         <Button variant={isRun ? "outline" : "default"} size="sm" className={cn("gap-1", isRun ? "bg-white" : "bg-primary text-white")}>
                           {isRun ? 'Modifier' : 'Exécuter'}
                           <ChevronRight className="w-4 h-4 opacity-50" />
                         </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};