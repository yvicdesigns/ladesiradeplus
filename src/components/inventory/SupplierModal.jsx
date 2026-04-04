import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export const SupplierModal = ({ open, onClose, onSave, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', city: '', postal_code: '', country: '', payment_terms: 'Net 30'
  });

  useEffect(() => {
    if (initialData) setFormData({ ...formData, ...initialData });
    else setFormData({ name: '', email: '', phone: '', address: '', city: '', postal_code: '', country: '', payment_terms: 'Net 30' });
  }, [initialData, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>{initialData ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
             <Label>Company Name</Label>
             <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
             </div>
             <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
             </div>
          </div>

          <div className="space-y-2">
             <Label>Address</Label>
             <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="space-y-2">
                <Label>City</Label>
                <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
             </div>
             <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input value={formData.postal_code} onChange={e => setFormData({...formData, postal_code: e.target.value})} />
             </div>
             <div className="space-y-2">
                <Label>Country</Label>
                <Input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
             </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};