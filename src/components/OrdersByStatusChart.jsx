import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from 'recharts';
import { formatRestaurantOrderStatus } from '@/lib/formatters';

const STATUS_COLORS = {
  pending: '#eab308',     // yellow-500
  confirmed: '#60a5fa',   // blue-400
  preparing: '#818cf8',   // indigo-400
  ready: '#c084fc',       // purple-400
  served: '#FCD34D',      // green-500
  delivered: '#FCD34D',   // green-500
  completed: '#FCD34D',   // green-500
  cancelled: '#ef4444',   // red-500
  unknown: '#94a3b8'      // slate-400
};

export const OrdersByStatusChart = ({ orders = [] }) => {
  const data = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    const counts = {};
    orders.forEach(order => {
      const status = order.status || 'unknown';
      counts[status] = (counts[status] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([status, count]) => ({
        name: formatRestaurantOrderStatus(status),
        rawStatus: status,
        value: count,
        color: STATUS_COLORS[status.toLowerCase()] || STATUS_COLORS.unknown
      }))
      .sort((a, b) => b.value - a.value);
  }, [orders]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
          <span className="font-medium text-slate-800">{data.name}:</span>
          <span className="font-bold text-slate-900">{data.value}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-5 rounded-xl shadow-sm bg-white border-slate-100 flex flex-col h-[350px]">
      <h3 className="text-base font-semibold text-slate-800 mb-2">Commandes par statut</h3>
      
      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          Aucune donnée
        </div>
      ) : (
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};