import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export const OrderDeletionTestReportGenerator = ({ results }) => {
  if (!results || results.length === 0) return null;

  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = total - passed;

  const StatusIcon = ({ status }) => {
    if (status === 'success' || status === true) return <CheckCircle className="w-4 h-4 text-amber-500" />;
    if (status === 'warning') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Badge variant="outline" className="text-lg py-1 px-3">Total: {total}</Badge>
          <Badge variant="default" className="bg-green-600 text-lg py-1 px-3">Passed: {passed}</Badge>
          <Badge variant="destructive" className="text-lg py-1 px-3">Failed: {failed}</Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((res, idx) => (
          <Card key={idx} className={res.success ? 'border-amber-200' : 'border-red-200'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center gap-2">
                <StatusIcon status={res.success} />
                {res.scenario}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {res.duration && <p className="text-muted-foreground">Duration: {res.duration}ms</p>}
              {res.error && <p className="text-red-500 font-medium">Error: {res.error}</p>}
              
              {res.verification && (
                <div className="mt-4 bg-slate-50 p-3 rounded-md space-y-1">
                  <p className="font-semibold mb-2">Verification Checks:</p>
                  {Object.entries(res.verification).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="capitalize">{key}:</span>
                      <div className="flex items-center gap-1">
                        <StatusIcon status={val.status} />
                        <span className="text-muted-foreground">{val.details}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};