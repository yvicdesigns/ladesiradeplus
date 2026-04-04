import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export const StockMovementModal = ({ open, onClose, onSave, ingredients }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ingredient_id: '', movement_type: 'usage', quantity: '', notes: ''
  });

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
        <DialogHeader><DialogTitle>Record Stock Movement</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
             <Label>Ingredient</Label>
             <Select value={formData.ingredient_id} onValueChange={val => setFormData({...formData, ingredient_id: val})}>
               <SelectTrigger><SelectValue placeholder="Select ingredient..." /></SelectTrigger>
               <SelectContent>
                 {ingredients.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
               </SelectContent>
             </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.movement_type} onValueChange={val => setFormData({...formData, movement_type: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usage">Usage</SelectItem>
                    <SelectItem value="waste">Waste</SelectItem>
                    <SelectItem value="adjustment">Correction</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" step="0.01" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
             </div>
          </div>

          <div className="space-y-2">
             <Label>Notes</Label>
             <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Reason for adjustment..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading || !formData.ingredient_id}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};