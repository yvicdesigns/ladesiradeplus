import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { supabase } from '@/lib/customSupabaseClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { 
  Search, 
  Filter, 
  History, 
  Eye, 
  RefreshCw,
  Utensils,
  Truck
} from 'lucide-react';
import { HistoryStatistics } from '@/components/HistoryStatistics';
import { HistoryExportButtons } from '@/components/HistoryExportButtons';
import { TopSellingDishesSection } from '@/components/TopSellingDishesSection';

export const AdminHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    startDate: '', // Default to empty to show all history
    endDate: '',
    type: 'all',
    status: 'all'
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch orders. We fetch a larger limit to ensure we see history.
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_orders (id, status, payment_method, created_at),
          restaurant_orders (id, status, payment_method, created_at)
        `)
        .order('created_at', { ascending: false })
        .limit(2000); // Increased limit for history

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Fetch full details when an order is selected
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!selectedOrder) return;
      
      setDetailsLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              quantity,
              price,
              notes,
              menu_item:menu_items (name, image_url)
            ),
            delivery_orders (*),
            restaurant_orders (*),
            tables (table_number)
          `)
          .eq('id', selectedOrder.id)
          .single();

        if (error) throw error;
        setOrderDetails(data);
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [selectedOrder]);

  const getStatusColor = (status) => {
    const s = status?.toLowerCase();
    if (['completed', 'delivered', 'served', 'paid'].includes(s)) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (['cancelled', 'rejected'].includes(s)) return 'bg-red-100 text-red-800 border-red-200';
    if (['pending', 'new'].includes(s)) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (['preparing', 'cooking', 'ready'].includes(s)) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getOrderTypeIcon = (type) => {
    if (type === 'delivery') return <Truck className="h-4 w-4" />;
    if (type === 'restaurant' || type === 'dine-in') return <Utensils className="h-4 w-4" />;
    return <History className="h-4 w-4" />;
  };

  // Filter Logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(filters.search.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      order.delivery_orders?.[0]?.customer_phone?.includes(filters.search);

    // Determine order date: prefer created_at column from sub-tables or main table
    const orderDateStr = order.delivery_orders?.[0]?.created_at || order.restaurant_orders?.[0]?.created_at || order.created_at;
    
    // Safety check for date string
    if (!orderDateStr) return false;
    
    const orderDate = new Date(orderDateStr);

    const matchesStartDate = !filters.startDate || orderDate >= new Date(filters.startDate);
    const matchesEndDate = !filters.endDate || orderDate <= new Date(new Date(filters.endDate).setHours(23, 59, 59));

    const matchesType = filters.type === 'all' || order.type === filters.type;

    // Check master status or specific table status
    const currentStatus = order.status || order.delivery_orders?.[0]?.status || order.restaurant_orders?.[0]?.status;
    const matchesStatus = filters.status === 'all' || currentStatus === filters.status;

    return matchesSearch && matchesStartDate && matchesEndDate && matchesType && matchesStatus;
  });

  const totalAmount = filteredOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <History className="h-8 w-8 text-primary" />
              Historique des Commandes
            </h1>
            <p className="text-muted-foreground mt-1">
              Consultez l'historique complet, les statistiques et exportez vos données.
            </p>
          </div>
          <Button onClick={fetchOrders} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Actualiser
          </Button>
        </div>

        {/* 1. Statistics Cards Component */}
        <HistoryStatistics orders={filteredOrders} />

        {/* 2. Filters & Export Section */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filtres & Actions
            </CardTitle>
            <div className="hidden md:block">
               <HistoryExportButtons orders={filteredOrders} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher (ID, Nom, Tél)..."
                  className="pl-9"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <Input
                  type="date"
                  placeholder="Début"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="block"
                />
              </div>

              <div className="flex flex-col gap-1">
                <Input
                  type="date"
                  placeholder="Fin"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="block"
                />
              </div>

              <Select 
                value={filters.type} 
                onValueChange={(val) => setFilters(prev => ({ ...prev, type: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type de commande" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="delivery">Livraison</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="dine-in">Sur place</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.status} 
                onValueChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="completed">Terminé / Livré</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                  <SelectItem value="preparing">En préparation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Mobile Export Buttons (visible only on small screens) */}
            <div className="md:hidden mt-4 pt-4 border-t flex justify-end">
                <HistoryExportButtons orders={filteredOrders} />
            </div>
          </CardContent>
        </Card>

        {/* Results Summary (Small text above table) */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Affichage de</span>
            <Badge variant="secondary">{filteredOrders.length}</Badge>
            <span className="text-sm text-gray-500">résultats filtrés</span>
          </div>
          <div className="flex items-center gap-2">
             {/* Total shown here is redundant with stats card but good for context */}
             <span className="text-sm text-gray-500">Total filtré:</span>
             <span className="font-mono font-bold text-sm text-primary">
                {formatCurrency(totalAmount)}
             </span>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="w-[140px]">Date</TableHead>
                <TableHead>N° Commande</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="w-[80px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Chargement de l'historique...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Aucune commande trouvée pour ces critères.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const status = order.status || order.delivery_orders?.[0]?.status || order.restaurant_orders?.[0]?.status;
                  const displayDate = order.delivery_orders?.[0]?.created_at || order.restaurant_orders?.[0]?.created_at || order.created_at;
                  
                  return (
                    <TableRow key={order.id} className="hover:bg-gray-50/80 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      <TableCell className="font-medium text-sm text-muted-foreground">
                        {formatDateTime(displayDate).split(' ')[0]} <br/>
                        <span className="text-xs text-gray-400">{formatDateTime(order.created_at).split(' ')[1]}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          #{order.id.slice(0, 8)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getOrderTypeIcon(order.type)}
                          <span className="capitalize text-sm">{order.type === 'dine-in' ? 'Sur place' : order.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {order.customer_name || 'Client Inconnu'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`capitalize font-normal ${getStatusColor(status)}`}>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-primary">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Separator before Top Selling Dishes */}
        <Separator className="my-8" />

        {/* 3. Top Selling Dishes Section */}
        <TopSellingDishesSection />

        {/* Order Details Modal */}
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between pr-8">
                <span className="flex items-center gap-2">
                  Détails Commande 
                  <span className="text-muted-foreground font-mono text-base font-normal">
                    #{selectedOrder?.id?.slice(0, 8)}
                  </span>
                </span>
              </DialogTitle>
              <DialogDescription>
                {selectedOrder && formatDateTime(selectedOrder.created_at)}
              </DialogDescription>
            </DialogHeader>

            {detailsLoading ? (
              <div className="py-12 flex justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary opacity-50" />
              </div>
            ) : orderDetails ? (
              <div className="space-y-6">
                {/* Status & Type Banner */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Type de commande</p>
                    <div className="flex items-center gap-2 font-semibold capitalize">
                      {getOrderTypeIcon(orderDetails.type)}
                      {orderDetails.type === 'dine-in' ? 'Sur place' : orderDetails.type}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Statut Actuel</p>
                    <Badge className={`text-sm ${getStatusColor(orderDetails.status || orderDetails.delivery_orders?.[0]?.status)}`}>
                      {(orderDetails.status || orderDetails.delivery_orders?.[0]?.status || orderDetails.restaurant_orders?.[0]?.status || 'Inconnu').toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                       👤 Client
                    </h3>
                    <div className="text-sm space-y-1 text-gray-600">
                      <p><span className="font-medium text-gray-900">Nom:</span> {orderDetails.customer_name || 'N/A'}</p>
                      {orderDetails.delivery_orders?.[0] && (
                        <p><span className="font-medium text-gray-900">Tél:</span> {orderDetails.delivery_orders[0].customer_phone || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                  
                  {orderDetails.type === 'delivery' && (
                    <div className="space-y-3">
                      <h3 className="font-semibold flex items-center gap-2">
                         📍 Livraison
                      </h3>
                      <div className="text-sm space-y-1 text-gray-600">
                        <p className="line-clamp-3">{orderDetails.delivery_address || 'Adresse non spécifiée'}</p>
                        {orderDetails.delivery_orders?.[0]?.vehicle_type && (
                             <p><span className="font-medium text-gray-900">Véhicule:</span> {orderDetails.delivery_orders[0].vehicle_type}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {(orderDetails.type === 'restaurant' || orderDetails.type === 'dine-in') && (
                    <div className="space-y-3">
                      <h3 className="font-semibold flex items-center gap-2">
                         🍽️ Restaurant
                      </h3>
                      <div className="text-sm space-y-1 text-gray-600">
                        <p><span className="font-medium text-gray-900">Table:</span> {orderDetails.tables?.table_number ? `Table ${orderDetails.tables.table_number}` : (orderDetails.table_id ? 'Table ?' : 'N/A')}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-3">Articles ({orderDetails.order_items?.length || 0})</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50">
                          <TableHead>Article</TableHead>
                          <TableHead className="text-center">Qté</TableHead>
                          <TableHead className="text-right">Prix</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderDetails.order_items?.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <div className="font-medium">{item.menu_item?.name || 'Article supprimé'}</div>
                              {item.notes && (
                                <div className="text-xs text-muted-foreground italic mt-0.5">Note: {item.notes}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.price * item.quantity)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-gray-50 font-bold">
                          <TableCell colSpan={3} className="text-right">Total Commande</TableCell>
                          <TableCell className="text-right text-lg text-primary">
                            {formatCurrency(orderDetails.total)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-red-500">
                Impossible de charger les détails.
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminHistoryPage;