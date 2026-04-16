import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { DollarSign, ShoppingBag, Truck, Utensils, Calendar } from 'lucide-react';

export const HistoryStatistics = ({ orders = [] }) => {
  const stats = useMemo(() => {
    if (!orders.length) return null;

    const totalCount = orders.length;
    
    // Revenue & Avg
    const totalRevenue = orders.reduce((sum, o) => {
       // Filter out cancelled orders from revenue calculation if desired, 
       // but typically history shows gross unless filtered by status.
       // Here we assume filtered data is what the user wants to analyze.
       if (['cancelled', 'rejected'].includes(o.status)) return sum;
       return sum + (Number(o.total) || 0);
    }, 0);
    
    const avgOrderValue = totalCount > 0 ? totalRevenue / totalCount : 0;

    // Type Breakdown
    const deliveryCount = orders.filter(o => o.type === 'delivery').length;
    const restaurantCount = orders.filter(o => ['restaurant', 'dine-in'].includes(o.type)).length;
    const deliveryPct = totalCount > 0 ? Math.round((deliveryCount / totalCount) * 100) : 0;
    const restaurantPct = totalCount > 0 ? Math.round((restaurantCount / totalCount) * 100) : 0;

    // Status Breakdown (Top 3)
    const statusCounts = orders.reduce((acc, o) => {
      const s = (o.status || 'unknown').toLowerCase();
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    
    const sortedStatuses = Object.entries(statusCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3) // Top 3
      .map(([status, count]) => ({
        status,
        count,
        pct: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
      }));

    // Top Revenue Day
    const revenueByDay = orders.reduce((acc, o) => {
       if (['cancelled', 'rejected'].includes(o.status)) return acc;
       
       const dateStr = (
        o.delivery_orders?.[0]?.order_date || 
        o.restaurant_orders?.[0]?.order_date || 
        o.created_at?.split('T')[0]
      );
      
      if(dateStr) {
          acc[dateStr] = (acc[dateStr] || 0) + (Number(o.total) || 0);
      }
      return acc;
    }, {});

    const topDayEntry = Object.entries(revenueByDay).sort(([,a], [,b]) => b - a)[0];
    const topDay = topDayEntry ? { date: topDayEntry[0], amount: topDayEntry[1] } : { date: 'N/A', amount: 0 };

    return {
      totalCount,
      totalRevenue,
      avgOrderValue,
      deliveryCount,
      deliveryPct,
      restaurantCount,
      restaurantPct,
      sortedStatuses,
      topDay
    };
  }, [orders]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
       {/* 1. Total Revenue */}
       <Card className="bg-white shadow-sm border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenu Total (Filtres)</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
               {stats.totalCount} commandes au total
            </p>
          </CardContent>
       </Card>

       {/* 2. Top Day & Avg */}
       <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Meilleure Journée</CardTitle>
            <Calendar className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(stats.topDay.amount)}</div>
            <p className="text-xs text-muted-foreground mt-1">
               {stats.topDay.date !== 'N/A' ? new Date(stats.topDay.date).toLocaleDateString() : '-'}
            </p>
            <div className="mt-2 text-xs border-t pt-2 flex justify-between">
                <span>Moyenne/Cmd:</span>
                <span className="font-semibold">{formatCurrency(stats.avgOrderValue)}</span>
            </div>
          </CardContent>
       </Card>

       {/* 3. Breakdown Type */}
       <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Répartition Type</CardTitle>
            <div className="flex gap-1">
                <Truck className="h-3 w-3 text-blue-500" />
                <Utensils className="h-3 w-3 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
             <div className="space-y-2 mt-1">
                 <div className="flex items-center justify-between text-sm">
                     <span className="flex items-center gap-1"><Truck className="h-3 w-3 text-blue-500"/> Livr.</span>
                     <span className="font-bold">{stats.deliveryCount} ({stats.deliveryPct}%)</span>
                 </div>
                 <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                     <div className="bg-blue-500 h-full" style={{ width: `${stats.deliveryPct}%` }}></div>
                 </div>
                 
                 <div className="flex items-center justify-between text-sm">
                     <span className="flex items-center gap-1"><Utensils className="h-3 w-3 text-amber-500"/> Resto</span>
                     <span className="font-bold">{stats.restaurantCount} ({stats.restaurantPct}%)</span>
                 </div>
                 <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                     <div className="bg-amber-500 h-full" style={{ width: `${stats.restaurantPct}%` }}></div>
                 </div>
             </div>
          </CardContent>
       </Card>

       {/* 4. Status Distribution */}
       <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Statuts</CardTitle>
            <ShoppingBag className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
             <div className="space-y-2 mt-1">
                {stats.sortedStatuses.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="capitalize px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                            {s.status}
                        </span>
                        <span>{s.count} <span className="text-gray-400">({s.pct}%)</span></span>
                    </div>
                ))}
             </div>
          </CardContent>
       </Card>
    </div>
  );
}