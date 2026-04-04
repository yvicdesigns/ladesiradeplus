import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Package, Banknote, BarChart3, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatRestaurantOrderStatus } from '@/lib/formatters';

export const StatisticsCards = ({ orders = [] }) => {
  const stats = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalOrders: 0,
        totalAmount: 0,
        averageAmount: 0,
        statusBreakdown: 'Aucune donnée'
      };
    }

    let totalAmount = 0;
    const statusCounts = {};

    orders.forEach(order => {
      // Amount
      const amount = Number(order.total) || Number(order.orders?.total) || 0;
      totalAmount += amount;

      // Status
      const status = order.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const totalOrders = orders.length;
    const averageAmount = totalOrders > 0 ? totalAmount / totalOrders : 0;

    // Format status breakdown
    const breakdown = Object.entries(statusCounts)
      .map(([status, count]) => `${formatRestaurantOrderStatus(status)}: ${count}`)
      .join(' | ');

    return {
      totalOrders,
      totalAmount,
      averageAmount,
      statusBreakdown: breakdown || 'Aucune donnée'
    };
  }, [orders]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* Card 1: Total Orders */}
      <Card className="p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white border-slate-100 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
          <Package className="h-6 w-6 text-blue-600" />
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-medium text-slate-500 mb-0.5">Total Commandes</p>
          <p className="text-2xl font-bold text-slate-900 truncate">
            {stats.totalOrders} <span className="text-sm font-normal text-slate-500">commandes</span>
          </p>
        </div>
      </Card>

      {/* Card 2: Total Amount */}
      <Card className="p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white border-slate-100 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
          <Banknote className="h-6 w-6 text-amber-600" />
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-medium text-slate-500 mb-0.5">Montant Total</p>
          <p className="text-2xl font-bold text-slate-900 truncate">
            {formatCurrency(stats.totalAmount)}
          </p>
        </div>
      </Card>

      {/* Card 3: Average Amount */}
      <Card className="p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white border-slate-100 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
          <BarChart3 className="h-6 w-6 text-amber-600" />
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-medium text-slate-500 mb-0.5">Panier Moyen</p>
          <p className="text-2xl font-bold text-slate-900 truncate">
            {formatCurrency(stats.averageAmount)}
          </p>
        </div>
      </Card>

      {/* Card 4: Status Breakdown */}
      <Card className="p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white border-slate-100 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-6 w-6 text-purple-600" />
        </div>
        <div className="overflow-hidden w-full flex flex-col justify-center">
          <p className="text-sm font-medium text-slate-500 mb-0.5">Par Statut</p>
          <p className="text-xs font-medium text-slate-700 truncate" title={stats.statusBreakdown}>
            {stats.statusBreakdown}
          </p>
        </div>
      </Card>
    </div>
  );
};