import React, { useState } from 'react';
import { useOrders } from '../hooks/useOrders';
import { OrderList } from '../components/OrderList';
import { Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const OrdersPage = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const { orders, loading } = useOrders({ status: statusFilter });

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" /> Mes Commandes
          </h1>
          <p className="text-gray-500 mt-2">Retrouvez l'historique complet de vos achats.</p>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px] bg-white text-gray-900">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les commandes</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="in_transit">En livraison</SelectItem>
            <SelectItem value="delivered">Livrées</SelectItem>
            <SelectItem value="cancelled">Annulées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <OrderList orders={orders} loading={loading} />
    </div>
  );
};

export default OrdersPage;