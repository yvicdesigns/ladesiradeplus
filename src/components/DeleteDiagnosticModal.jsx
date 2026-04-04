import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDeliveryOrderDiagnostics } from '@/hooks/useDeliveryOrderDiagnostics';
import { AlertCircle, Loader2, Activity, Trash2 } from 'lucide-react';

export const DeleteDiagnosticModal = ({ order, open, onOpenChange, onConfirmDelete, isDeleting }) => {
  const { analyzeDeletion, loading, error } = useDeliveryOrderDiagnostics();
  const [analysis, setAnalysis] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (open && order?.id) {
      setConfirmed(false);
      loadAnalysis();
    }
  }, [open, order]);

  const loadAnalysis = async () => {
    const result = await analyzeDeletion(order.id);
    setAnalysis(result);
  };

  const handleConfirm = () => {
    if (confirmed && onConfirmDelete) {
      onConfirmDelete(order);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!isDeleting) onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500" />
            Deletion Preview & Diagnostics
          </DialogTitle>
          <DialogDescription>
            Analyzing dependencies for Delivery Order #{order?.id?.slice(0, 8)} before deletion.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-sm text-gray-500">Tracing database relationships...</p>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Analysis Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : analysis ? (
          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="space-y-6">
              {/* Related Records Summary */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Related Records Found:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-3 bg-gray-50 rounded-md border flex justify-between items-center">
                    <span className="text-gray-600">Target Delivery Order</span>
                    <Badge variant={analysis.records.deliveryOrder ? "default" : "destructive"}>
                      {analysis.records.deliveryOrder ? '1 Found' : 'Missing'}
                    </Badge>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md border flex justify-between items-center">
                    <span className="text-gray-600">Parent Order (orders)</span>
                    <Badge variant={analysis.records.parentOrder ? "secondary" : "outline"}>
                      {analysis.records.parentOrder ? '1 Found' : 'None'}
                    </Badge>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md border flex justify-between items-center col-span-2">
                    <span className="text-gray-600">Order Items</span>
                    <Badge variant="outline">{analysis.records.orderItems.length} Items</Badge>
                  </div>
                </div>
              </div>

              {/* Execution Plan */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Deletion Execution Plan:</h4>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-100">
                      <TableRow>
                        <TableHead className="w-12">Step</TableHead>
                        <TableHead>Target Table</TableHead>
                        <TableHead>Rows</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.plan.map((step) => (
                        <TableRow key={step.step}>
                          <TableCell className="font-bold">{step.step}</TableCell>
                          <TableCell className="font-mono text-xs">{step.table}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{step.count}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">{step.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Generated Query */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Executed Query Pattern:</h4>
                <pre className="bg-slate-950 text-green-400 p-4 rounded-md text-xs font-mono overflow-x-auto">
                  {analysis.query}
                </pre>
              </div>

              <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Warning: Permanent Action</AlertTitle>
                <AlertDescription>
                  This will permanently delete the delivery order. Ensure cascade rules are properly set in Supabase to avoid orphaned records.
                </AlertDescription>
              </Alert>
            </div>
          </ScrollArea>
        ) : null}

        <DialogFooter className="mt-6 flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Checkbox 
              id="confirm-delete" 
              checked={confirmed} 
              onCheckedChange={setConfirmed}
              disabled={loading || isDeleting || !analysis}
            />
            <label
              htmlFor="confirm-delete"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700"
            >
              I understand this will delete {analysis?.records?.orderItems?.length || 0} related records.
            </label>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirm} 
              disabled={!confirmed || loading || isDeleting || !analysis}
            >
              {isDeleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : <><Trash2 className="w-4 h-4 mr-2" /> Execute Deletion</>}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};