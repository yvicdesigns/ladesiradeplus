import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MobileMoneyPaymentConfirmationModal } from '@/components/MobileMoneyPaymentConfirmationModal';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { Eye, Smartphone, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { PAYMENT_STATUSES } from '@/lib/deliveryConstants';

export const AdminMobileMoneyPaymentsTab = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, mtn, airtel
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, confirmed
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();

    const deliveryChannel = supabase
      .channel('admin_mobile_payments_delivery')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_orders' }, () => fetchPayments())
      .subscribe();
      
    const restaurantChannel = supabase
      .channel('admin_mobile_payments_restaurant')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_orders' }, () => fetchPayments())
      .subscribe();

    return () => {
      supabase.removeChannel(deliveryChannel);
      supabase.removeChannel(restaurantChannel);
    };
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // Fetch delivery orders with Mobile Money payment
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('payment_method', 'mobile_money')
        .order('created_at', { ascending: false });

      if (deliveryError) throw deliveryError;

      // Fetch restaurant orders with Mobile Money payment
      const { data: restData, error: restError } = await supabase
        .from('restaurant_orders')
        .select('*')
        .eq('payment_method', 'mobile_money')
        .order('created_at', { ascending: false });

      if (restError) throw restError;

      // Combine and format
      const formattedDelivery = (deliveryData || []).map(o => ({ ...o, orderType: 'delivery' }));
      const formattedRest = (restData || []).map(o => ({ ...o, orderType: 'restaurant' }));
      
      setPayments([...formattedDelivery, ...formattedRest].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      console.error('Error fetching mobile payments:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les paiements Mobile Money."
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.id.toLowerCase().includes(search.toLowerCase()) || 
      (payment.client_email && payment.client_email.toLowerCase().includes(search.toLowerCase()));
    
    const matchesType = filterType === 'all' || payment.mobile_money_type === filterType;
    
    // Status logic: 
    const isConfirmed = payment.payment_status === PAYMENT_STATUSES.CONFIRMED || payment.payment_status === 'paid';
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'confirmed' ? isConfirmed : !isConfirmed);

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par ID ou email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Opérateur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous Opérateurs</SelectItem>
              <SelectItem value="mtn">MTN Money</SelectItem>
              <SelectItem value="airtel">Airtel Money</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous Statuts</SelectItem>
              <SelectItem value="pending">En Attente</SelectItem>
              <SelectItem value="confirmed">Confirmé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Opérateur</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Preuve</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">Chargement...</TableCell>
              </TableRow>
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">Aucun paiement trouvé.</TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => {
                 const isConfirmed = payment.payment_status === PAYMENT_STATUSES.CONFIRMED || payment.payment_status === 'paid';
                 
                 return (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm">{formatDateTime(payment.created_at)}</TableCell>
                    <TableCell className="font-medium">{payment.client_email || 'Anonyme'}</TableCell>
                    <TableCell className="capitalize text-xs text-muted-foreground">{payment.orderType}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={payment.mobile_money_type === 'mtn' ? 'border-yellow-500 text-yellow-600 bg-yellow-50' : 'border-red-500 text-red-600 bg-red-50'}>
                        {payment.mobile_money_type?.toUpperCase() || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold">{formatCurrency(payment.orderType === 'delivery' ? payment.total_with_fee : payment.total)}</TableCell>
                    <TableCell>
                      {payment.payment_screenshot_url ? (
                        <div className="w-8 h-8 rounded overflow-hidden border bg-muted">
                           <img src={payment.payment_screenshot_url} alt="Proof" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Aucune</span>
                      )}
                    </TableCell>
                    <TableCell>
                       <Badge className={isConfirmed ? 'bg-green-600 text-white' : 'bg-orange-500 text-white'}>
                        {isConfirmed ? 'Validé ✓' : 'En Attente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedPayment(payment)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Vérifier
                      </Button>
                    </TableCell>
                  </TableRow>
                 )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <MobileMoneyPaymentConfirmationModal 
        order={selectedPayment}
        orderType={selectedPayment?.orderType}
        open={!!selectedPayment}
        onOpenChange={(open) => !open && setSelectedPayment(null)}
        onConfirmSuccess={fetchPayments}
      />
    </div>
  );
};