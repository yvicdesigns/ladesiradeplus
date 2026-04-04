import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Calendar, DollarSign, ShoppingBag, MessageSquare, Edit, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';

export const CustomerDetailModal = ({ open, onClose, customer, onEdit, onDelete, onMessage }) => {
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && customer?.id) {
      fetchHistory();
    }
  }, [open, customer]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Fetch orders
      const { data: ordersData } = await supabase
        .from('customer_orders')
        .select('*')
        .eq('customer_id', customer.id)
        .order('order_date', { ascending: false });
      
      setOrders(ordersData || []);

      // Fetch reservations
      const { data: resData } = await supabase
        .from('customer_reservations')
        .select('*')
        .eq('customer_id', customer.id)
        .order('reservation_date', { ascending: false });
      
      setReservations(resData || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card className="bg-muted/50 border-border">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase">{title}</p>
          <p className="text-xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-full ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader className="border-b border-border pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                {customer.name?.charAt(0) || 'C'}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">{customer.name || 'Unknown Customer'}</DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3" />
                  {customer.city || 'Unknown City'}, {customer.country || 'Unknown Country'}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title="Total Visits" 
            value={customer.total_visits || 0} 
            icon={ShoppingBag} 
            color="bg-blue-500" 
          />
          <StatCard 
            title="Total Spent" 
            value={`$${customer.total_spent || 0}`} 
            icon={DollarSign} 
            color="bg-amber-500" 
          />
          <StatCard 
            title="Last Visit" 
            value={customer.last_visit ? format(new Date(customer.last_visit), 'MMM d, yyyy') : 'N/A'} 
            icon={Calendar} 
            color="bg-amber-500" 
          />
          <StatCard 
            title="Registered" 
            value={customer.registration_date ? format(new Date(customer.registration_date), 'MMM d, yyyy') : 'N/A'} 
            icon={Calendar} 
            color="bg-purple-500" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar Info */}
          <div className="md:col-span-1 space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone || 'No phone'}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>
                    {customer.address}<br/>
                    {customer.city}, {customer.postal_code}<br/>
                    {customer.country}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Notes</h3>
              <div className="bg-muted/30 p-3 rounded-md text-sm italic min-h-[100px] border border-border">
                {customer.notes || "No notes available."}
              </div>
            </div>
          </div>

          {/* Main Content Tabs */}
          <div className="md:col-span-2">
            <Tabs defaultValue="orders" className="w-full">
              <TabsList className="w-full grid grid-cols-2 bg-muted/50">
                <TabsTrigger value="orders">Order History</TabsTrigger>
                <TabsTrigger value="reservations">Reservations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="orders" className="mt-4">
                <div className="space-y-3">
                  {orders.length > 0 ? (
                    orders.map(order => (
                      <div key={order.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                        <div>
                          <p className="font-medium">{format(new Date(order.order_date), 'MMM d, yyyy')}</p>
                          <p className="text-sm text-muted-foreground">{order.items_count} items</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${order.total_amount}</p>
                          <Badge variant="outline" className="text-xs uppercase">{order.status}</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No order history found.</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="reservations" className="mt-4">
                 <div className="space-y-3">
                  {reservations.length > 0 ? (
                    reservations.map(res => (
                      <div key={res.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                        <div>
                          <p className="font-medium">{format(new Date(res.reservation_date), 'MMM d, yyyy')}</p>
                          <p className="text-sm text-muted-foreground">{res.guests_count} Guests</p>
                        </div>
                        <Badge variant={res.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize">
                          {res.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No reservation history found.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="mt-6 border-t border-border pt-4 gap-2 sm:gap-0">
          <div className="flex gap-2 w-full sm:w-auto mr-auto">
             <Button variant="outline" onClick={onMessage} className="flex-1 sm:flex-none">
              <MessageSquare className="h-4 w-4 mr-2" /> Message
            </Button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="secondary" onClick={() => onEdit(customer)} className="flex-1 sm:flex-none">
              <Edit className="h-4 w-4 mr-2" /> Edit Details
            </Button>
            <Button variant="destructive" onClick={() => onDelete(customer)} className="flex-1 sm:flex-none">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};