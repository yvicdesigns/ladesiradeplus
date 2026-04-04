import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export const PurchaseOrderModal = ({ open, onClose, onSave, suppliers, ingredients }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: '', order_number: `PO-${Date.now()}`, 
    order_date: new Date().toISOString().split('T')[0], expected_delivery_date: ''
  });
  const [items, setItems] = useState([]);

  const addItem = () => {
    setItems([...items, { ingredient_id: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    // Auto fill unit price from ingredient if selected
    if (field === 'ingredient_id') {
      const ing = ingredients.find(i => i.id === value);
      if (ing) {
        item.unit_price = ing.unit_cost;
      }
    }
    
    // Recalculate total
    if (field === 'quantity' || field === 'unit_price' || field === 'ingredient_id') {
      item.total_price = Number(item.quantity) * Number(item.unit_price);
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const calculateTotal = () => items.reduce((sum, item) => sum + item.total_price, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave({ ...formData, total_amount: calculateTotal() }, items);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
               <Label>Supplier</Label>
               <Select value={formData.supplier_id} onValueChange={val => setFormData({...formData, supplier_id: val})}>
                 <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
                 <SelectContent>
                   {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                 </SelectContent>
               </Select>
            </div>
            <div className="space-y-2">
               <Label>Order #</Label>
               <Input value={formData.order_number} onChange={e => setFormData({...formData, order_number: e.target.value})} required />
            </div>
            <div className="space-y-2">
               <Label>Expected Delivery</Label>
               <Input type="date" value={formData.expected_delivery_date} onChange={e => setFormData({...formData, expected_delivery_date: e.target.value})} />
            </div>
          </div>

          <div className="border rounded-md p-4 bg-muted/20">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-sm">Order Items</h4>
              <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus className="w-3 h-3 mr-1"/> Add Item</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Ingredient</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Select value={item.ingredient_id} onValueChange={val => updateItem(idx, 'ingredient_id', val)}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ingredients.filter(i => !formData.supplier_id || i.supplier_id === formData.supplier_id).map(i => (
                            <SelectItem key={i.id} value={i.id}>{i.name} ({i.unit})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input type="number" className="h-8" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" step="0.01" className="h-8" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} />
                    </TableCell>
                    <TableCell className="font-medium text-right">
                      {formatCurrency(item.total_price)}
                    </TableCell>
                    <TableCell>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeItem(idx)}>
                        <Trash2 className="w-4 h-4"/>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end mt-4 text-lg font-bold">
              Total: {formatCurrency(calculateTotal())}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading || !formData.supplier_id || items.length === 0}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Create Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};