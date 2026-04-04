import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export const GeneratePromoCodesModal = ({ open, onClose, promotions, onGenerate }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    promotion_id: '',
    count: '10',
    prefix: 'PROMO'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onGenerate(formData.promotion_id, parseInt(formData.count), formData.prefix);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Promo Codes</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Promotion</Label>
            <Select value={formData.promotion_id} onValueChange={val => setFormData({...formData, promotion_id: val})}>
              <SelectTrigger><SelectValue placeholder="Choose a promotion..." /></SelectTrigger>
              <SelectContent>
                {promotions.filter(p => p.status === 'active').map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min="1" max="1000" value={formData.count} onChange={e => setFormData({...formData, count: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Prefix</Label>
              <Input value={formData.prefix} onChange={e => setFormData({...formData, prefix: e.target.value.toUpperCase()})} placeholder="SUMMER" required />
            </div>
          </div>

          <div className="bg-muted p-3 rounded text-xs text-muted-foreground">
             Example: {formData.prefix}-X7Y29A
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading || !formData.promotion_id}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Generate Codes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};