import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';

export const SendInvoiceEmailModal = ({ open, onClose, invoice, onSend }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    recipientEmail: invoice?.customer_email || '',
    subject: `Invoice #${invoice?.invoice_number} from Restaurant`,
    message: `Dear ${invoice?.customer_name},\n\nPlease find attached the invoice for your recent order.\n\nThank you for your business!`
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSend({
      invoiceId: invoice.id,
      invoiceDetails: invoice,
      ...formData
    });
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Invoice via Email</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Recipient Email</Label>
            <Input 
              type="email" 
              value={formData.recipientEmail} 
              onChange={e => setFormData({...formData, recipientEmail: e.target.value})} 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input 
              value={formData.subject} 
              onChange={e => setFormData({...formData, subject: e.target.value})} 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea 
              className="min-h-[120px]"
              value={formData.message} 
              onChange={e => setFormData({...formData, message: e.target.value})} 
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2"/>} 
              Send Email
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};