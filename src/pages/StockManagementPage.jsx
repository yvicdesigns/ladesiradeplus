import React, { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Package, History } from 'lucide-react';
import { AdminStockManagementTab } from '@/components/AdminStockManagementTab';
import { StockMovementHistoryPanel } from '@/components/StockMovementHistoryPanel';

export const StockManagementPage = () => {
  const [activeTab, setActiveTab] = useState('levels');

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-8 w-8 text-amber-600" /> Gestion des Stocks Plats
          </h1>
          <p className="text-muted-foreground mt-1">Supervisez et ajustez les quantités disponibles pour vos plats et menus.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-lg">
            <TabsTrigger value="levels" className="gap-2 font-medium px-6 py-2">
              <Package className="h-4 w-4" /> Niveaux de Stock
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 font-medium px-6 py-2">
              <History className="h-4 w-4" /> Audit & Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="levels" className="mt-6">
            <AdminStockManagementTab />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-inner">
              <StockMovementHistoryPanel />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default StockManagementPage;