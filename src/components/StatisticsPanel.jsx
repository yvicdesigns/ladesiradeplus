import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Package, Banknote, TrendingUp, Activity } from 'lucide-react';
import { formatCurrency, formatDeliveryStatusFR, getDeliveryStatusColor } from '@/lib/formatters';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export const StatisticsPanel = ({ orders = [] }) => {
  const stats = useMemo(() => {
    let totalAmount = 0;
    const statusCounts = {};
    const dailyDataMap = {};
    
    // Initialize last 30 days for chart
    for (let i = 29; i >= 0; i--) {
      const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dailyDataMap[dateStr] = { date: dateStr, displayDate: format(subDays(new Date(), i), 'dd/MM'), amount: 0 };
    }

    orders.forEach(order => {
      const amount = Number(order.total) || 0;
      totalAmount += amount;

      const status = order.status || 'pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      if (order.created_at) {
        const dateStr = format(new Date(order.created_at), 'yyyy-MM-dd');
        if (dailyDataMap[dateStr]) {
          dailyDataMap[dateStr].amount += amount;
        }
      }
    });

    const averageAmount = orders.length > 0 ? totalAmount / orders.length : 0;
    
    const statusData = Object.keys(statusCounts).map(status => ({
      name: formatDeliveryStatusFR(status),
      count: statusCounts[status]
    })).sort((a, b) => b.count - a.count);

    const dailyData = Object.values(dailyDataMap);

    return {
      totalCount: orders.length,
      totalAmount,
      averageAmount,
      statusCounts,
      statusData,
      dailyData
    };
  }, [orders]);

  const CustomTooltipLine = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-1">{label}</p>
          <p className="text-blue-600 font-bold">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-gray-500">Total Commandes</p>
            <p className="text-2xl font-bold text-gray-900 truncate">{stats.totalCount}</p>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center gap-4 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-amber-50 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <Banknote className="w-6 h-6 text-amber-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-gray-500">Montant Total</p>
            <p className="text-2xl font-bold text-gray-900 truncate">{formatCurrency(stats.totalAmount)}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-amber-50 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-amber-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-gray-500">Panier Moyen</p>
            <p className="text-2xl font-bold text-gray-900 truncate">{formatCurrency(stats.averageAmount)}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-purple-50 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 text-purple-600" />
          </div>
          <div className="overflow-hidden w-full">
            <p className="text-sm font-medium text-gray-500 mb-1">Top Statuts</p>
            <div className="flex flex-col gap-1 text-xs">
              {stats.statusData.slice(0, 2).map((item, idx) => (
                <div key={idx} className="flex justify-between w-full pr-2">
                  <span className="text-gray-600 truncate mr-2" title={item.name}>{item.name}</span>
                  <span className="font-bold text-gray-900">{item.count}</span>
                </div>
              ))}
              {stats.statusData.length === 0 && <span className="text-gray-400 italic">Aucune donnée</span>}
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 border-gray-100 shadow-sm h-[320px] flex flex-col">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Évolution des Revenus (30 jours)</h3>
          {stats.totalCount > 0 ? (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#6b7280' }} 
                    tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltipLine />} />
                  <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Aucune donnée disponible</div>
          )}
        </Card>

        <Card className="p-5 border-gray-100 shadow-sm h-[320px] flex flex-col">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Répartition par Statut</h3>
          {stats.statusData.length > 0 ? (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.statusData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4b5563' }} width={120} />
                  <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Aucune donnée disponible</div>
          )}
        </Card>
      </div>
    </div>
  );
};