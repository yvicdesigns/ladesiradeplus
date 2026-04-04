import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDeliveries } from '@/hooks/useDeliveries';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';

export const DeliveryCreateModal = ({ open, onClose }) => {
  const { createDelivery, loading } = useDeliveries();
  const [orders, setOrders] = useState([]);
  const [fetchingOrders, setFetchingOrders] = useState(false);
  
  const [formData, setFormData] = useState({
    order_id: '',
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    customer_city: '',
    delivery_date: '',
    delivery_time: '',
    vehicle_type: 'scooter',
    notes: ''
  });

  useEffect(() => {
    if (open) {
      fetchOrders();
    }
  }, [open]);

  const fetchOrders = async () => {
    setFetchingOrders(true);
    try {
      // Fetch recent orders that are ready or preparing
      const { data } = await supabase
        .from('orders')
        .select('id, created_at, total_amount')
        .in('status', ['ready', 'preparing'])
        .order('created_at', { ascending: false })
        .limit(10);
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setFetchingOrders(false);
    }
  };

  const handleOrderSelect = async (orderId) => {
    // When an order is selected, try to pre-fill customer info if available
    // For now we just set the ID, but in a real app we'd fetch order details
    setFormData(prev => ({ ...prev, order_id: orderId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await createDelivery(formData);
    if (success) {
      onClose();
      setFormData({
        order_id: '',
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        customer_city: '',
        delivery_date: '',
        delivery_time: '',
        vehicle_type: 'scooter',
        notes: ''
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Delivery</DialogTitle>
          <DialogDescription>Manually create a new delivery entry.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Link Order (Optional)</Label>
              <Select value={formData.order_id} onValueChange={handleOrderSelect} disabled={fetchingOrders}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Order" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map(order => (
                    <SelectItem key={order.id} value={order.id}>
                      #{order.id.slice(0, 8)} - ${order.total_amount}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select 
                value={formData.vehicle_type} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, vehicle_type: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scooter">Scooter</SelectItem>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input 
                required 
                value={formData.customer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input 
                required 
                value={formData.customer_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address *</Label>
            <Input 
              required 
              value={formData.customer_address}
              onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
              placeholder="123 Main St, Apt 4B"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input 
                value={formData.customer_city}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_city: e.target.value }))}
                placeholder="New York"
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="date"
                required
                value={formData.delivery_date}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input 
                type="time"
                required
                value={formData.delivery_time}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea 
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Gate code, special instructions..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Delivery
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};