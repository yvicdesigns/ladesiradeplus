import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';

export const DailyRevenueChart = ({ orders = [] }) => {
  const data = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    // Filter to last 30 days based on current data
    const thirtyDaysAgo = subDays(new Date(), 30);
    
    // Group by date
    const dailyTotals = {};
    orders.forEach(order => {
      if (!order.created_at) return;
      
      const orderDate = new Date(order.created_at);
      if (orderDate < thirtyDaysAgo) return;

      const dateStr = format(orderDate, 'yyyy-MM-dd');
      const amount = Number(order.total) || Number(order.orders?.total) || 0;

      if (!dailyTotals[dateStr]) {
        dailyTotals[dateStr] = {
          date: dateStr,
          amount: 0,
          count: 0
        };
      }
      dailyTotals[dateStr].amount += amount;
      dailyTotals[dateStr].count += 1;
    });

    // Convert to array and sort by date
    return Object.values(dailyTotals).sort((a, b) => a.date.localeCompare(b.date)).map(item => ({
      ...item,
      displayDate: format(parseISO(item.date), 'dd/MM')
    }));
  }, [orders]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg">
          <p className="font-semibold text-slate-800 mb-1">{payload[0].payload.displayDate}</p>
          <p className="text-blue-600 font-bold">{formatCurrency(payload[0].value)}</p>
          <p className="text-slate-500 text-xs mt-1">{payload[0].payload.count} commande(s)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-5 rounded-xl shadow-sm bg-white border-slate-100 flex flex-col h-[350px]">
      <h3 className="text-base font-semibold text-slate-800 mb-6">Montant par jour (derniers 30 jours)</h3>
      
      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          Aucune donnée
        </div>
      ) : (
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(val) => `${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
              <Bar 
                dataKey="amount" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};