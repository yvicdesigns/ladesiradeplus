import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export const IngredientModal = ({ open, onClose, onSave, supplierList, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', category: 'produce', unit: 'kg', 
    current_stock: 0, min_stock: 0, max_stock: 100, reorder_point: 10,
    unit_cost: 0, supplier_id: '', barcode: '', description: ''
  });

  useEffect(() => {
    if (initialData) setFormData({ ...formData, ...initialData });
    else setFormData({
      name: '', category: 'produce', unit: 'kg', 
      current_stock: 0, min_stock: 0, max_stock: 100, reorder_point: 10,
      unit_cost: 0, supplier_id: '', barcode: '', description: ''
    });
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader><DialogTitle>{initialData ? 'Edit Ingredient' : 'Add New Ingredient'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={val => setFormData({...formData, category: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="produce">Produce</SelectItem>
                  <SelectItem value="meat">Meat</SelectItem>
                  <SelectItem value="dairy">Dairy</SelectItem>
                  <SelectItem value="dry_goods">Dry Goods</SelectItem>
                  <SelectItem value="beverage">Beverage</SelectItem>
                  <SelectItem value="alcohol">Alcohol</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
             <div className="space-y-2">
               <Label>Current Stock</Label>
               <Input type="number" step="0.01" value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: e.target.value})} required />
             </div>
             <div className="space-y-2">
               <Label>Unit</Label>
               <Select value={formData.unit} onValueChange={val => setFormData({...formData, unit: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="l">L</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="pcs">pieces</SelectItem>
                  <SelectItem value="box">box</SelectItem>
                </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <Label>Unit Cost (€)</Label>
               <Input type="number" step="0.01" value={formData.unit_cost} onChange={e => setFormData({...formData, unit_cost: e.target.value})} required />
             </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="space-y-2">
               <Label>Min Stock</Label>
               <Input type="number" step="0.01" value={formData.min_stock} onChange={e => setFormData({...formData, min_stock: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label>Max Stock</Label>
               <Input type="number" step="0.01" value={formData.max_stock} onChange={e => setFormData({...formData, max_stock: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label>Reorder Point</Label>
               <Input type="number" step="0.01" value={formData.reorder_point} onChange={e => setFormData({...formData, reorder_point: e.target.value})} />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={formData.supplier_id} onValueChange={val => setFormData({...formData, supplier_id: val})}>
                  <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>
                    {supplierList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label>Barcode (Optional)</Label>
                <Input value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
             </div>
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
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