import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeliveryOrders } from '../hooks/useDeliveryOrders';
import { OrderList } from './OrderList';
import { ORDER_STATUSES } from '../constants';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export const AdminOrdersPanel = () => {
  const { orders, loading, setFilters } = useDeliveryOrders();

  const handleTabChange = (value) => {
    setFilters({ status: value });
  };

  return (
    <div className="space-y-6 pb-20 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Commandes</h1>
          <p className="text-gray-500 mt-1">Supervisez et mettez à jour l'état de toutes les commandes.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Rechercher une commande..." className="pl-9 bg-gray-50 border-gray-200 text-gray-900" />
        </div>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-0">
          <Tabs defaultValue="all" onValueChange={handleTabChange} className="w-full">
            <div className="px-6 pt-4 border-b border-gray-100 overflow-x-auto">
              <TabsList className="bg-transparent h-auto p-0 flex gap-6 justify-start min-w-max">
                <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 pt-2 text-gray-600 data-[state=active]:text-primary font-bold">
                  Toutes
                </TabsTrigger>
                <TabsTrigger value={ORDER_STATUSES.PENDING} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-yellow-500 rounded-none px-2 pb-3 pt-2 text-gray-600 data-[state=active]:text-yellow-600 font-bold">
                  En attente
                </TabsTrigger>
                <TabsTrigger value={ORDER_STATUSES.PREPARING} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none px-2 pb-3 pt-2 text-gray-600 data-[state=active]:text-purple-600 font-bold">
                  En préparation
                </TabsTrigger>
                <TabsTrigger value={ORDER_STATUSES.DELIVERED} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-green-500 rounded-none px-2 pb-3 pt-2 text-gray-600 data-[state=active]:text-amber-600 font-bold">
                  Livrées / Servies
                </TabsTrigger>
                <TabsTrigger value={ORDER_STATUSES.CANCELLED} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-red-500 rounded-none px-2 pb-3 pt-2 text-gray-600 data-[state=active]:text-red-600 font-bold">
                  Annulées
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6">
              <TabsContent value="all" className="mt-0 outline-none"><OrderList orders={orders.map(o => o.orders)} loading={loading} /></TabsContent>
              <TabsContent value={ORDER_STATUSES.PENDING} className="mt-0 outline-none"><OrderList orders={orders.map(o => o.orders)} loading={loading} /></TabsContent>
              <TabsContent value={ORDER_STATUSES.PREPARING} className="mt-0 outline-none"><OrderList orders={orders.map(o => o.orders)} loading={loading} /></TabsContent>
              <TabsContent value={ORDER_STATUSES.DELIVERED} className="mt-0 outline-none"><OrderList orders={orders.map(o => o.orders)} loading={loading} /></TabsContent>
              <TabsContent value={ORDER_STATUSES.CANCELLED} className="mt-0 outline-none"><OrderList orders={orders.map(o => o.orders)} loading={loading} /></TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};