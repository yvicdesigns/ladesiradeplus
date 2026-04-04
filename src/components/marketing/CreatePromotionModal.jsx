import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export const CreatePromotionModal = ({ open, onClose, onCreate }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    min_order_amount: '0',
    max_uses: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onCreate('promotions', {
      ...formData,
      status: 'active'
    }, "Promotion created successfully");
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Promotion</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Promotion Name</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
               <Label>Discount Type</Label>
               <Select value={formData.discount_type} onValueChange={val => setFormData({...formData, discount_type: val})}>
                 <SelectTrigger><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="percentage">Percentage (%)</SelectItem>
                   <SelectItem value="fixed_amount">Fixed Amount (€)</SelectItem>
                   <SelectItem value="free_shipping">Free Shipping</SelectItem>
                 </SelectContent>
               </Select>
            </div>
            {formData.discount_type !== 'free_shipping' && (
              <div className="space-y-2">
                 <Label>Value</Label>
                 <Input type="number" step="0.01" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: e.target.value})} required />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} required />
             </div>
             <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} required />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Min Order Amount</Label>
                <Input type="number" step="0.01" value={formData.min_order_amount} onChange={e => setFormData({...formData, min_order_amount: e.target.value})} />
             </div>
             <div className="space-y-2">
                <Label>Max Uses (Optional)</Label>
                <Input type="number" value={formData.max_uses} onChange={e => setFormData({...formData, max_uses: e.target.value})} />
             </div>
          </div>

          <div className="space-y-2">
             <Label>Description</Label>
             <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Create Promotion
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};