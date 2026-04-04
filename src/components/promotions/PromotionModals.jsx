import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const FormField = ({ label, children }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {children}
  </div>
);

// Helper to convert empty strings to null for numeric fields
const toNumericOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

export const PromotionModal = ({ open, onClose, promotion, onSave }) => {
  const [formData, setFormData] = useState({ name: '', description: '', type: 'percentage', discount_type: 'percentage', discount_value: '', min_order_amount: '', max_discount_amount: '', start_date: '', end_date: '', usage_limit: '', status: 'draft' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (promotion) {
      setFormData({ 
        ...promotion,
        discount_value: promotion.discount_value ?? '',
        min_order_amount: promotion.min_order_amount ?? '',
        max_discount_amount: promotion.max_discount_amount ?? '',
        usage_limit: promotion.usage_limit ?? '',
        start_date: promotion.start_date ? new Date(promotion.start_date).toISOString().split('T')[0] : '',
        end_date: promotion.end_date ? new Date(promotion.end_date).toISOString().split('T')[0] : ''
      });
    } else {
      setFormData({ name: '', description: '', type: 'percentage', discount_type: 'percentage', discount_value: '', min_order_amount: '', max_discount_amount: '', start_date: '', end_date: '', usage_limit: '', status: 'draft' });
    }
  }, [promotion, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      ...formData,
      discount_value: toNumericOrNull(formData.discount_value),
      min_order_amount: toNumericOrNull(formData.min_order_amount),
      max_discount_amount: toNumericOrNull(formData.max_discount_amount),
      usage_limit: toNumericOrNull(formData.usage_limit),
    };

    await onSave(payload);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{promotion ? 'Edit Promotion' : 'Create Promotion'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <FormField label="Name"><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></FormField>
          <FormField label="Description"><Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></FormField>
          <div className="grid grid-cols-2 gap-4">
             <FormField label="Type">
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="fixed_amount">Fixed Amount</SelectItem><SelectItem value="free_shipping">Free Shipping</SelectItem><SelectItem value="buy_one_get_one">BOGO</SelectItem><SelectItem value="bundle">Bundle</SelectItem></SelectContent>
                </Select>
             </FormField>
             <FormField label="Status">
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="paused">Paused</SelectItem><SelectItem value="expired">Expired</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent>
                </Select>
             </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <FormField label="Discount Value"><Input type="number" step="0.01" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: e.target.value})} /></FormField>
             <FormField label="Max Discount"><Input type="number" step="0.01" value={formData.max_discount_amount} onChange={e => setFormData({...formData, max_discount_amount: e.target.value})} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <FormField label="Start Date"><Input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} /></FormField>
             <FormField label="End Date"><Input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <FormField label="Min Order Amount"><Input type="number" step="0.01" value={formData.min_order_amount} onChange={e => setFormData({...formData, min_order_amount: e.target.value})} /></FormField>
             <FormField label="Usage Limit"><Input type="number" value={formData.usage_limit} onChange={e => setFormData({...formData, usage_limit: e.target.value})} /></FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const PromoCodeModal = ({ open, onClose, code, onSave, promotions }) => {
  const [formData, setFormData] = useState({ code: '', promotion_id: '', discount_type: 'percentage', discount_value: '', min_order_amount: '', max_discount_amount: '', start_date: '', expiry_date: '', max_uses: '', status: 'active' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (code) {
      setFormData({
        ...code,
        discount_value: code.discount_value ?? '',
        min_order_amount: code.min_order_amount ?? '',
        max_discount_amount: code.max_discount_amount ?? '',
        max_uses: code.max_uses ?? '',
        start_date: code.start_date ? new Date(code.start_date).toISOString().split('T')[0] : '',
        expiry_date: code.expiry_date ? new Date(code.expiry_date).toISOString().split('T')[0] : ''
      });
    } else {
      setFormData({ code: '', promotion_id: '', discount_type: 'percentage', discount_value: '', min_order_amount: '', max_discount_amount: '', start_date: '', expiry_date: '', max_uses: '', status: 'active' });
    }
  }, [code, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      ...formData,
      discount_value: toNumericOrNull(formData.discount_value),
      min_order_amount: toNumericOrNull(formData.min_order_amount),
      max_discount_amount: toNumericOrNull(formData.max_discount_amount),
      max_uses: toNumericOrNull(formData.max_uses),
    };

    await onSave(payload);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
       <DialogContent className="sm:max-w-[600px]">
        <DialogHeader><DialogTitle>{code ? 'Edit Promo Code' : 'Create Promo Code'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Code (Uppercase)">
              <Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} required placeholder="SUMMER2026" />
            </FormField>
            <FormField label="Associated Promotion">
              <Select value={formData.promotion_id} onValueChange={v => setFormData({...formData, promotion_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {promotions.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <FormField label="Discount Type">
               <Select value={formData.discount_type} onValueChange={v => setFormData({...formData, discount_type: v})}>
                 <SelectTrigger><SelectValue /></SelectTrigger>
                 <SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="fixed_amount">Fixed Amount</SelectItem></SelectContent>
               </Select>
             </FormField>
             <FormField label="Value"><Input type="number" step="0.01" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: e.target.value})} required /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <FormField label="Start Date"><Input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} /></FormField>
             <FormField label="Expiry Date"><Input type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <FormField label="Min Order"><Input type="number" step="0.01" value={formData.min_order_amount} onChange={e => setFormData({...formData, min_order_amount: e.target.value})} /></FormField>
             <FormField label="Usage Limit"><Input type="number" value={formData.max_uses} onChange={e => setFormData({...formData, max_uses: e.target.value})} /></FormField>
          </div>
          <FormField label="Status">
              <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="paused">Paused</SelectItem><SelectItem value="expired">Expired</SelectItem></SelectContent>
              </Select>
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </form>
       </DialogContent>
    </Dialog>
  );
};

export const SpecialOfferModal = ({ open, onClose, offer, onSave }) => {
  const [formData, setFormData] = useState({ name: '', description: '', offer_type: 'percentage', discount_value: '', priority: 0, status: 'active', start_date: '', end_date: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (offer) {
      setFormData({
        ...offer,
        discount_value: offer.discount_value ?? '',
        priority: offer.priority ?? 0,
        start_date: offer.start_date ? new Date(offer.start_date).toISOString().split('T')[0] : '',
        end_date: offer.end_date ? new Date(offer.end_date).toISOString().split('T')[0] : ''
      });
    } else {
      setFormData({ name: '', description: '', offer_type: 'percentage', discount_value: '', priority: 0, status: 'active', start_date: '', end_date: '' });
    }
  }, [offer, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      ...formData,
      discount_value: toNumericOrNull(formData.discount_value),
      priority: toNumericOrNull(formData.priority) ?? 0,
    };

    await onSave(payload);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader><DialogTitle>{offer ? 'Edit Special Offer' : 'Create Special Offer'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <FormField label="Name"><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></FormField>
          <FormField label="Description"><Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></FormField>
          <div className="grid grid-cols-2 gap-4">
             <FormField label="Type">
                <Select value={formData.offer_type} onValueChange={v => setFormData({...formData, offer_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="fixed_amount">Fixed Amount</SelectItem><SelectItem value="free_shipping">Free Shipping</SelectItem><SelectItem value="bundle">Bundle</SelectItem><SelectItem value="loyalty">Loyalty</SelectItem></SelectContent>
                </Select>
             </FormField>
             <FormField label="Priority"><Input type="number" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <FormField label="Value"><Input type="number" step="0.01" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: e.target.value})} /></FormField>
             <FormField label="Status">
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="paused">Paused</SelectItem><SelectItem value="expired">Expired</SelectItem></SelectContent>
                </Select>
             </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <FormField label="Start Date"><Input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} /></FormField>
             <FormField label="End Date"><Input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} /></FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const PromotionRuleModal = ({ open, onClose, rule, onSave, promotions }) => {
  const [formData, setFormData] = useState({ promotion_id: '', rule_type: 'min_quantity', rule_value: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rule) setFormData(rule);
    else setFormData({ promotion_id: '', rule_type: 'min_quantity', rule_value: '' });
  }, [rule, open]);

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
        <DialogHeader><DialogTitle>{rule ? 'Edit Rule' : 'Add Rule'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <FormField label="Promotion">
              <Select value={formData.promotion_id} onValueChange={v => setFormData({...formData, promotion_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {promotions.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
          </FormField>
          <FormField label="Rule Type">
              <Select value={formData.rule_type} onValueChange={v => setFormData({...formData, rule_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="min_quantity">Min Quantity</SelectItem>
                    <SelectItem value="specific_category">Specific Category</SelectItem>
                    <SelectItem value="specific_item">Specific Item</SelectItem>
                    <SelectItem value="customer_segment">Customer Segment</SelectItem>
                    <SelectItem value="first_purchase">First Purchase Only</SelectItem>
                </SelectContent>
              </Select>
          </FormField>
          <FormField label="Rule Value">
              <Input 
                value={formData.rule_value} 
                onChange={e => setFormData({...formData, rule_value: e.target.value})} 
                placeholder={formData.rule_type === 'min_quantity' ? 'e.g. 3' : 'Value ID or Text'}
                disabled={formData.rule_type === 'first_purchase'}
              />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};