import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Users, UserCheck, UserMinus, UserX } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell, PieChart, Pie } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export const ClientStatisticsPanel = ({ clients = [] }) => {
  const stats = useMemo(() => {
    let active = 0;
    let inactive = 0;
    let suspended = 0;
    const dailyDataMap = {};
    
    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dailyDataMap[dateStr] = { date: dateStr, displayDate: format(subDays(new Date(), i), 'dd/MM'), count: 0 };
    }

    clients.forEach(client => {
      // Status counting
      const status = client.statut_client || 'Actif';
      if (status === 'Actif') active++;
      else if (status === 'Inactif') inactive++;
      else if (status === 'Suspendu') suspended++;
      else active++; // Default to active

      // Daily registrations
      if (client.created_at) {
        const dateStr = client.created_at.split('T')[0];
        if (dailyDataMap[dateStr]) {
          dailyDataMap[dateStr].count += 1;
        }
      }
    });

    const pieData = [
      { name: 'Actifs', value: active, color: '#10b981' }, // green-500
      { name: 'Inactifs', value: inactive, color: '#f59e0b' }, // yellow-500
      { name: 'Suspendus', value: suspended, color: '#ef4444' } // red-500
    ].filter(d => d.value > 0);

    const dailyData = Object.values(dailyDataMap);

    return {
      total: clients.length,
      active,
      inactive,
      suspended,
      dailyData,
      pieData
    };
  }, [clients]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-800 mb-1">{label}</p>
          <p className="text-indigo-600 font-bold">{payload[0].value} inscrit(s)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 border-slate-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-default bg-white rounded-xl">
          <div className="bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-500">Total Clients</p>
            <p className="text-2xl font-bold text-slate-900 truncate">{stats.total}</p>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center gap-4 border-slate-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-default bg-white rounded-xl">
          <div className="bg-amber-50 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6 text-amber-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-500">Clients Actifs</p>
            <p className="text-2xl font-bold text-slate-900 truncate">{stats.active}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-slate-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-default bg-white rounded-xl">
          <div className="bg-yellow-50 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <UserMinus className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-500">Clients Inactifs</p>
            <p className="text-2xl font-bold text-slate-900 truncate">{stats.inactive}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-slate-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-default bg-white rounded-xl">
          <div className="bg-red-50 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <UserX className="w-6 h-6 text-red-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-500">Clients Suspendus</p>
            <p className="text-2xl font-bold text-slate-900 truncate">{stats.suspended}</p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 border-slate-200 shadow-sm rounded-xl bg-white h-[320px] flex flex-col lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Inscriptions (30 derniers jours)</h3>
          {stats.total > 0 ? (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    allowDecimals={false}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Aucune donnée disponible</div>
          )}
        </Card>

        <Card className="p-5 border-slate-200 shadow-sm rounded-xl bg-white h-[320px] flex flex-col">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Répartition par Statut</h3>
          {stats.pieData.length > 0 ? (
            <div className="flex-1 min-h-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stats.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value, name) => [value, name]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-800">{stats.total}</span>
                <span className="text-xs text-slate-500">Total</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Aucune donnée disponible</div>
          )}
        </Card>
      </div>
    </div>
  );
};