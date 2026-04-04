import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export const CreateInvoiceModal = ({ open, onClose, onCreate }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    invoice_number: `INV-${Date.now()}`,
    customer_name: '',
    customer_email: '',
    amount_ht: '',
    tax: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const amountHt = parseFloat(formData.amount_ht) || 0;
    const tax = parseFloat(formData.tax) || 0;
    
    await onCreate({
      ...formData,
      amount_ht: amountHt,
      tax: tax,
      total_ttc: amountHt + tax,
      status: 'issued'
    });
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Invoice #</Label>
              <Input value={formData.invoice_number} onChange={e => setFormData({...formData, invoice_number: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} required />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
               <Label>Customer Name</Label>
               <Input value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} required />
            </div>
            <div className="space-y-2">
               <Label>Customer Email</Label>
               <Input type="email" value={formData.customer_email} onChange={e => setFormData({...formData, customer_email: e.target.value})} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Amount HT ($)</Label>
                <Input type="number" step="0.01" value={formData.amount_ht} onChange={e => setFormData({...formData, amount_ht: e.target.value})} required />
             </div>
             <div className="space-y-2">
                <Label>Tax Amount ($)</Label>
                <Input type="number" step="0.01" value={formData.tax} onChange={e => setFormData({...formData, tax: e.target.value})} required />
             </div>
          </div>

          <div className="space-y-2">
             <Label>Notes</Label>
             <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Create Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};