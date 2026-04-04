import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Users, CalendarDays, Activity, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { formatReservationStatus } from '@/lib/formatters';

export const ReservationStatistics = ({ reservations = [], loading = false }) => {
  const stats = useMemo(() => {
    let totalGuests = 0;
    const statusCounts = {};
    const dailyDataMap = {};
    
    // Initialize last 30 days for chart
    for (let i = 29; i >= 0; i--) {
      const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dailyDataMap[dateStr] = { date: dateStr, displayDate: format(subDays(new Date(), i), 'dd/MM'), count: 0 };
    }

    reservations.forEach(res => {
      const guests = Number(res.party_size) || 0;
      totalGuests += guests;

      const status = res.status || 'pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      if (res.reservation_date) {
        // Date format is likely YYYY-MM-DD
        const dateStr = res.reservation_date;
        if (dailyDataMap[dateStr]) {
          dailyDataMap[dateStr].count += 1;
        } else {
          // If it's a future date or outside 30 days, we might want to still track it or just ignore for the 30-day chart
          // For simplicity, we'll only chart the initialized dates.
        }
      }
    });

    const averageGuests = reservations.length > 0 ? (totalGuests / reservations.length).toFixed(1) : 0;
    
    const statusData = Object.keys(statusCounts).map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      count: statusCounts[status]
    })).sort((a, b) => b.count - a.count);

    const dailyData = Object.values(dailyDataMap);

    return {
      totalCount: reservations.length,
      totalGuests,
      averageGuests,
      statusCounts,
      statusData,
      dailyData
    };
  }, [reservations]);

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-gray-500">Chargement des statistiques...</div>;
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-1">{label}</p>
          <p className="text-blue-600 font-bold">{payload[0].value} réservations</p>
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
            <CalendarDays className="w-6 h-6 text-blue-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-gray-500">Total Réservations</p>
            <p className="text-2xl font-bold text-gray-900 truncate">{stats.totalCount}</p>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center gap-4 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-amber-50 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-amber-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-gray-500">Total Couverts</p>
            <p className="text-2xl font-bold text-gray-900 truncate">{stats.totalGuests}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-amber-50 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 text-amber-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-gray-500">Moy. Couverts/Rés.</p>
            <p className="text-2xl font-bold text-gray-900 truncate">{stats.averageGuests}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-purple-50 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-purple-600" />
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
          <h3 className="text-base font-semibold text-gray-800 mb-4">Évolution des Réservations (30 jours)</h3>
          {stats.totalCount > 0 ? (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#6b7280' }} 
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
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
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4b5563' }} width={100} />
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