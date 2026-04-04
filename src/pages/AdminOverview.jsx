import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { LiveFeed } from '@/components/LiveFeed';
import { formatCurrency } from '@/lib/formatters';
import { supabase } from '@/lib/customSupabaseClient';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { 
  ShoppingBag, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export const AdminOverview = () => {
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState({
    revenue: 0,
    count: 0,
    avgOrderValue: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    breakdown: { completed: 0, pending: 0, cancelled: 0 }
  });
  const [comparison, setComparison] = useState({
    yesterdayRevenue: 0,
    percentageChange: 0,
    isPositive: true
  });
  const [chartData, setChartData] = useState([]);

  const subscriptionResult = useRealtimeSubscription('orders');
  const realtimeOrders = subscriptionResult?.data || [];

  const fetchAnalytics = async () => {
    try {
      if (todayStats.count === 0 && loading) setLoading(true);

      const todayDate = new Date();
      const today = todayDate.toISOString().split('T')[0];
      
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toISOString().split('T')[0];
      
      const sevenDaysAgoDate = new Date();
      sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
      const sevenDaysAgo = sevenDaysAgoDate.toISOString().split('T')[0];

      const { data: todayOrdersData, error: todayError } = await supabase
          .from('orders')
          .select('id, total, status, created_at')
          .gte('created_at', `${today}T00:00:00`);
      
      if (todayError) throw todayError;

      const { data: historicalOrders, error: historyError } = await supabase
        .from('orders')
        .select('created_at, total, status')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: true });
        
      if (historyError) throw historyError;

      const validOrders = todayOrdersData || [];
      
      const todayRevenue = validOrders.reduce((sum, o) => {
        if (['cancelled', 'rejected'].includes(o.status)) return sum;
        return sum + (Number(o.total) || 0);
      }, 0);

      const todayCount = validOrders.length;
      const completedCount = validOrders.filter(o => ['completed', 'delivered', 'served', 'paid'].includes(o.status)).length;
      const cancelledCount = validOrders.filter(o => ['cancelled', 'rejected'].includes(o.status)).length;
      const pendingCount = todayCount - completedCount - cancelledCount;

      setTodayStats({
        revenue: todayRevenue,
        count: todayCount,
        avgOrderValue: todayCount > 0 ? todayRevenue / todayCount : 0,
        completed: completedCount,
        pending: pendingCount,
        cancelled: cancelledCount,
        breakdown: { completed: completedCount, pending: pendingCount, cancelled: cancelledCount }
      });

      const yesterdayOrders = historicalOrders?.filter(o => o.created_at.startsWith(yesterday)) || [];
      const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => {
        if (['cancelled', 'rejected'].includes(o.status)) return sum;
        return sum + (Number(o.total) || 0);
      }, 0);

      let percentageChange = 0;
      if (yesterdayRevenue > 0) {
        percentageChange = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
      } else if (todayRevenue > 0) {
        percentageChange = 100;
      }

      setComparison({
        yesterdayRevenue,
        percentageChange: percentageChange.toFixed(1),
        isPositive: percentageChange >= 0
      });

      const chartMap = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' }) || dStr;
        chartMap[dStr] = { name: dayName, date: dStr, revenue: 0, orders: 0 };
      }

      historicalOrders?.forEach(o => {
        const dateKey = o.created_at.split('T')[0];
        if (chartMap[dateKey] && !['cancelled', 'rejected'].includes(o.status)) {
          chartMap[dateKey].revenue += (Number(o.total) || 0);
          chartMap[dateKey].orders += 1;
        }
      });

      setChartData(Object.values(chartMap));

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 300000);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 pb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Tableau de Bord</h2>
          <p className="text-muted-foreground text-base mt-1 font-medium">
            Vue d'ensemble de l'activité du restaurant.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
             <Skeleton className="h-[220px] w-full rounded-xl" />
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Skeleton className="h-[120px] rounded-xl" />
               <Skeleton className="h-[120px] rounded-xl" />
               <Skeleton className="h-[120px] rounded-xl" />
             </div>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {/* HERO SECTION: Today's Revenue */}
            <motion.div variants={itemVariants}>
              <Card className="border-none shadow-lg bg-gradient-to-r from-blue-600 to-blue-400 text-white overflow-hidden relative rounded-xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <DollarSign className="w-64 h-64 transform rotate-12 -translate-y-12 translate-x-12" />
                </div>
                <CardContent className="p-8 relative z-10">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                      <div className="space-y-4">
                         <h3 className="text-blue-100 font-semibold text-xl tracking-wide uppercase">
                            Revenu du Jour
                         </h3>
                         <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-sm">
                               {formatCurrency(todayStats.revenue)}
                            </h1>
                            <div className={`inline-flex w-fit items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${comparison.isPositive ? 'bg-amber-500/20 text-amber-100 backdrop-blur-md border border-green-500/30' : 'bg-red-500/20 text-red-100 backdrop-blur-md border border-red-500/30'}`}>
                               {comparison.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                               <span>{Math.abs(comparison.percentageChange)}% vs hier</span>
                            </div>
                         </div>
                         <p className="text-blue-50 text-sm font-medium">
                            Comparé à {formatCurrency(comparison.yesterdayRevenue)} hier.
                         </p>
                      </div>

                      <div className="flex flex-wrap gap-4 lg:justify-end">
                          <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 min-w-[150px] border border-white/20 shadow-inner">
                             <div className="flex items-center gap-2 text-green-300 mb-2">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-wider">Complétées</span>
                             </div>
                             <div className="flex items-baseline gap-1">
                               <span className="text-3xl font-extrabold">{todayStats.completed}</span>
                             </div>
                          </div>

                          <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 min-w-[150px] border border-white/20 shadow-inner">
                             <div className="flex items-center gap-2 text-yellow-300 mb-2">
                                <Clock className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-wider">En cours</span>
                             </div>
                             <div className="flex items-baseline gap-1">
                               <span className="text-3xl font-extrabold">{todayStats.pending}</span>
                             </div>
                          </div>

                          <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 min-w-[150px] border border-white/20 shadow-inner">
                             <div className="flex items-center gap-2 text-red-300 mb-2">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-wider">Annulées</span>
                             </div>
                             <div className="flex items-baseline gap-1">
                               <span className="text-3xl font-extrabold">{todayStats.cancelled}</span>
                             </div>
                          </div>
                      </div>
                   </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* SECONDARY STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div variants={itemVariants}>
                <Card className="rounded-xl shadow-lg border-0 bg-white">
                   <CardContent className="p-6">
                     <div className="flex justify-between items-start">
                       <div>
                         <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Volume de Commandes</p>
                         <h3 className="text-3xl font-bold text-gray-900">{todayStats.count}</h3>
                         <p className="text-sm text-gray-500 mt-2 font-medium">Total commandes reçues aujourd'hui</p>
                       </div>
                       <div className="p-3 bg-amber-100 rounded-lg">
                         <ShoppingBag className="h-6 w-6 text-amber-500" />
                       </div>
                     </div>
                   </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="rounded-xl shadow-lg border-0 bg-white">
                   <CardContent className="p-6">
                     <div className="flex justify-between items-start">
                       <div>
                         <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Panier Moyen</p>
                         <h3 className="text-3xl font-bold text-gray-900">{formatCurrency(todayStats.avgOrderValue)}</h3>
                         <p className="text-sm text-gray-500 mt-2 font-medium">Moyenne par commande</p>
                       </div>
                       <div className="p-3 bg-amber-100 rounded-lg">
                         <DollarSign className="h-6 w-6 text-amber-600" />
                       </div>
                     </div>
                   </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="rounded-xl shadow-lg border-0 bg-white">
                   <CardContent className="p-6">
                     <div className="flex justify-between items-start">
                       <div>
                         <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Taux de Complétition</p>
                         <h3 className="text-3xl font-bold text-gray-900">
                           {todayStats.count > 0 ? Math.round((todayStats.completed / todayStats.count) * 100) : 0}%
                         </h3>
                         <p className="text-sm text-gray-500 mt-2 font-medium">Commandes servies/livrées avec succès</p>
                       </div>
                       <div className="p-3 bg-blue-100 rounded-lg">
                         <CheckCircle className="h-6 w-6 text-blue-600" />
                       </div>
                     </div>
                   </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
               {/* REVENUE CHART */}
               <motion.div 
                 className="lg:col-span-4 h-full"
                 variants={itemVariants}
               >
                 <Card className="h-full shadow-lg border-0 rounded-xl bg-white">
                   <CardHeader className="border-b border-gray-100 pb-4">
                     <CardTitle className="text-lg font-bold text-gray-900">Revenus sur 7 Jours</CardTitle>
                     <CardDescription className="font-medium">Analyse de la tendance des ventes.</CardDescription>
                   </CardHeader>
                   <CardContent className="pt-6">
                     <div className="h-[350px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="name" 
                              stroke="#6b7280" 
                              fontSize={12} 
                              tickLine={false} 
                              axisLine={false}
                              dy={10}
                            />
                            <YAxis 
                              stroke="#6b7280" 
                              fontSize={12} 
                              tickLine={false} 
                              axisLine={false} 
                              tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip 
                              formatter={(value) => formatCurrency(value)}
                              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="revenue" 
                              stroke="#2563eb" 
                              strokeWidth={3}
                              dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                              activeDot={{ r: 6, fill: '#2563eb', strokeWidth: 0 }}
                            />
                         </LineChart>
                       </ResponsiveContainer>
                     </div>
                   </CardContent>
                 </Card>
               </motion.div>

               {/* LIVE FEED */}
               <motion.div 
                 className="lg:col-span-3 h-full"
                 variants={itemVariants}
               >
                 <Card className="h-full shadow-lg border-0 rounded-xl bg-white flex flex-col">
                   <CardHeader className="border-b border-gray-100 pb-4 flex flex-row items-center justify-between space-y-0">
                     <div>
                       <CardTitle className="text-lg font-bold text-gray-900">Live Activity Feed</CardTitle>
                       <CardDescription className="font-medium">Mises à jour en temps réel.</CardDescription>
                     </div>
                     <span className="relative flex h-3 w-3">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                     </span>
                   </CardHeader>
                   <CardContent className="pt-4 flex-1 p-0 overflow-hidden">
                     <LiveFeed />
                   </CardContent>
                 </Card>
               </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
};