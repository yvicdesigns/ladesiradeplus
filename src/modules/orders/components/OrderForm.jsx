import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateOrder } from '../hooks/useCreateOrder';
import { ORDER_TYPES } from '../constants';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OrderForm = ({ cartItems = [], total = 0, onClearCart }) => {
  const { createOrder, loading } = useCreateOrder();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    order_type: ORDER_TYPES.DELIVERY,
    delivery_address: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    const payload = {
      ...formData,
      items: cartItems,
      total,
      order_method: 'online',
      delivery_data: formData.order_type === ORDER_TYPES.DELIVERY ? {
        customer_id: null,
        payment_method: 'cash',
        delivery_fee: 0,
      } : null
    };

    const orderId = await createOrder(payload);
    if (orderId) {
      if (onClearCart) onClearCart();
      navigate(`/orders/${orderId}`);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900">Finaliser la commande</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="order_type">Type de commande</Label>
            <Select value={formData.order_type} onValueChange={(val) => setFormData(p => ({...p, order_type: val}))}>
              <SelectTrigger className="bg-white text-gray-900">
                <SelectValue placeholder="Choisir le type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ORDER_TYPES.DELIVERY}>Livraison</SelectItem>
                <SelectItem value={ORDER_TYPES.COUNTER}>À emporter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Nom complet *</Label>
              <Input required id="customer_name" name="customer_name" value={formData.customer_name} onChange={handleChange} className="bg-white text-gray-900" placeholder="Jean Dupont" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_phone">Téléphone *</Label>
              <Input required id="customer_phone" name="customer_phone" value={formData.customer_phone} onChange={handleChange} className="bg-white text-gray-900" placeholder="06 12 34 56 78" />
            </div>
          </div>

          {formData.order_type === ORDER_TYPES.DELIVERY && (
            <div className="space-y-2">
              <Label htmlFor="delivery_address">Adresse de livraison *</Label>
              <Textarea required id="delivery_address" name="delivery_address" value={formData.delivery_address} onChange={handleChange} className="bg-white text-gray-900" placeholder="Votre adresse complète" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Instructions spéciales</Label>
            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} className="bg-white text-gray-900" placeholder="Code digicode, sans oignons, etc." />
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 flex justify-between items-center py-4 border-t">
          <div className="text-lg font-bold text-gray-900">Total: {total.toFixed(2)} FCFA</div>
          <Button type="submit" disabled={loading || cartItems.length === 0} className="bg-primary text-white hover:bg-primary/90">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Confirmer la commande
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};