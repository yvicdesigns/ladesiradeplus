import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { CreditCard, User, FileText, Calendar, CheckCircle, XCircle } from 'lucide-react';

export const PaymentDetailModal = ({ open, onClose, payment, onUpdateStatus }) => {
  if (!payment) return null;

  const getStatusColor = (s) => {
    switch(s) {
      case 'completed': return 'bg-amber-100 text-amber-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-black text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Payment Details
            <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3"/> Order ID</span>
              <p className="font-mono text-sm">#{payment.order_id ? payment.order_id.slice(0,8) : 'N/A'}</p>
            </div>
            <div className="space-y-1">
               <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3"/> Date</span>
               <p className="text-sm">{formatDateTime(payment.payment_date)}</p>
            </div>
          </div>

          <div className="bg-muted/30 p-3 rounded-md space-y-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3"/> Customer</span>
            <p className="font-medium text-sm">{payment.customer_name || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">{payment.customer_email}</p>
          </div>

          <div className="flex items-center justify-between border-t border-b py-3 border-dashed">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Amount</span>
              <p className="text-xl font-bold">{formatCurrency(payment.amount)}</p>
            </div>
            <div className="text-right space-y-1">
              <span className="text-xs text-muted-foreground">Method</span>
              <div className="flex items-center gap-1 justify-end">
                <CreditCard className="w-4 h-4"/>
                <span className="text-sm">{payment.payment_method || 'Card'} •••• 4242</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
             <span className="text-xs text-muted-foreground">Transaction ID</span>
             <p className="font-mono text-xs text-muted-foreground">{payment.transaction_id || 'N/A'}</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {payment.status === 'pending' && (
            <>
              <Button variant="destructive" onClick={() => onUpdateStatus(payment.id, 'cancelled')}>
                <XCircle className="w-4 h-4 mr-2"/> Cancel
              </Button>
              <Button onClick={() => onUpdateStatus(payment.id, 'completed')}>
                <CheckCircle className="w-4 h-4 mr-2"/> Mark Paid
              </Button>
            </>
          )}
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};