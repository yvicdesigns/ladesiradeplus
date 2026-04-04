import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { Check, X, RotateCcw } from 'lucide-react';

export const RefundDetailModal = ({ open, onClose, refund, onUpdateStatus }) => {
  if (!refund) return null;

  const getStatusColor = (s) => {
    switch(s) {
      case 'processed': return 'bg-amber-100 text-amber-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Refund Request
            <Badge className={getStatusColor(refund.status)}>{refund.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-red-50 p-4 rounded-lg flex items-center justify-between border border-red-100">
            <span className="font-medium text-red-900">Refund Amount</span>
            <span className="text-xl font-bold text-red-700">{formatCurrency(refund.amount)}</span>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Reason</h4>
            <p className="text-sm">{refund.reason}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
             <div>
               <span className="text-muted-foreground">Customer</span>
               <p className="font-medium">{refund.customer_name}</p>
             </div>
             <div>
               <span className="text-muted-foreground">Request Date</span>
               <p className="font-medium">{formatDateTime(refund.request_date)}</p>
             </div>
          </div>
          
          {refund.notes && (
             <div className="text-sm bg-muted p-3 rounded">
                <span className="text-xs text-muted-foreground block mb-1">Internal Notes</span>
                {refund.notes}
             </div>
          )}
        </div>

        <DialogFooter>
          {refund.status === 'pending' && (
            <>
              <Button variant="destructive" onClick={() => onUpdateStatus(refund.id, 'rejected')}>
                <X className="w-4 h-4 mr-2"/> Reject
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => onUpdateStatus(refund.id, 'approved')}>
                <Check className="w-4 h-4 mr-2"/> Approve
              </Button>
            </>
          )}
          {refund.status === 'approved' && (
             <Button className="bg-green-600 hover:bg-green-700" onClick={() => onUpdateStatus(refund.id, 'processed')}>
                <RotateCcw className="w-4 h-4 mr-2"/> Process Refund
             </Button>
          )}
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};