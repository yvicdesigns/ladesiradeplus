import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Send, CheckCircle, Trash2, Download } from 'lucide-react';
import { SendInvoiceEmailModal } from './SendInvoiceEmailModal';

export const InvoiceDetailModal = ({ open, onClose, invoice, onUpdateStatus, onDelete, onSendEmail }) => {
  const [showEmailModal, setShowEmailModal] = useState(false);

  if (!invoice) return null;

  const getStatusColor = (s) => {
    switch(s) {
      case 'paid': return 'bg-amber-100 text-amber-800';
      case 'issued': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              Invoice #{invoice.invoice_number}
              <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Bill To</h4>
                <p className="font-medium">{invoice.customer_name}</p>
                <p className="text-sm text-muted-foreground">{invoice.customer_email}</p>
              </div>
              <div className="text-right">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Issue Date:</span>
                  <span>{formatDate(invoice.issue_date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span>{formatDate(invoice.due_date)}</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-muted/10 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal (HT)</span>
                <span>{formatCurrency(invoice.amount_ht)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>Total (TTC)</span>
                <span>{formatCurrency(invoice.total_ttc)}</span>
              </div>
            </div>

            {invoice.notes && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Notes</h4>
                <p className="text-sm bg-muted p-2 rounded">{invoice.notes}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
              <Button variant="outline" size="sm" onClick={() => setShowEmailModal(true)}>
                <Send className="w-4 h-4 mr-2"/> Email
              </Button>
              <Button variant="outline" size="sm" onClick={() => alert("PDF Download mockup triggered")}>
                <Download className="w-4 h-4 mr-2"/> PDF
              </Button>
            </div>
            <div className="flex gap-2">
              {invoice.status !== 'paid' && (
                <Button variant="default" size="sm" onClick={() => onUpdateStatus(invoice.id, 'paid')}>
                  <CheckCircle className="w-4 h-4 mr-2"/> Mark Paid
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={() => onDelete(invoice.id)}>
                <Trash2 className="w-4 h-4"/>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <SendInvoiceEmailModal 
        open={showEmailModal} 
        onClose={() => setShowEmailModal(false)}
        invoice={invoice}
        onSend={onSendEmail}
      />
    </>
  );
};