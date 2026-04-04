import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/customSupabaseClient';
import { formatCurrency } from '@/lib/formatters';
import { LiveFeed } from '@/components/LiveFeed';
import { executeWithResilience, getFriendlyErrorMessage } from '@/lib/supabaseErrorHandler';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { 
  ShoppingBag, Clock, DollarSign, TrendingUp, TrendingDown, 
  CheckCircle, CheckCircle2, X, Activity, AlertCircle, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';

export const AdminDashboard = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [todayStats, setTodayStats] = useState({
    revenue: 0, count: 0, avgOrderValue: 0, completed: 0, pending: 0, cancelled: 0,
  });
  const [comparison, setComparison] = useState({
    yesterdayRevenue: 0, percentageChange: 0, isPositive: true
  });
  const [chartData, setChartData] = useState([]);

  const fetchAnalytics = async () => {
    try {
      setError(null);
      if (todayStats.count === 0 && loading) setLoading(true);

      const todayDate = new Date();
      const today = todayDate.toISOString().split('T')[0];
      
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toISOString().split('T')[0];
      
      const sevenDaysAgoDate = new Date();
      sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
      const sevenDaysAgo = sevenDaysAgoDate.toISOString().split('T')[0];

      const [{ data: todayOrdersData, error: todayError }, { data: historicalOrders, error: historyError }] = await Promise.all([
        executeWithResilience(async () => supabase
          .from('orders')
          .select('id, total, status, created_at')
          .gte('created_at', `${today}T00:00:00`), 
          { context: 'Dashboard Today Orders' }
        ),
        executeWithResilience(async () => supabase
          .from('orders')
          .select('created_at, total, status')
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: true }),
          { context: 'Dashboard Historical Orders' }
        )
      ]);
      
      if (todayError) throw todayError;
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
        cancelled: cancelledCount
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

    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 300000); 
    return () => clearInterval(interval);
  }, []);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 landscape:space-y-3 pb-12 md:pb-8 landscape:pb-4">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 landscape:gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl landscape:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
               {t('admin.dashboard.title')}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t('admin.dashboard.subtitle')}
            </p>
          </div>
          {error && (
             <Button variant="outline" size="sm" onClick={fetchAnalytics} className="gap-2 landscape:h-8">
               <RefreshCw className="h-4 w-4" /> {t('common.refresh')}
             </Button>
          )}
        </div>

        {error ? (
          <Alert variant="destructive" className="mb-6 landscape:mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('common.error')}</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchAnalytics} className="ml-4 min-h-[36px] landscape:min-h-[32px] bg-background">
                {t('common.refresh')}
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <div className="space-y-6 landscape:space-y-3">
             <Skeleton className="h-[240px] landscape:h-[180px] w-full rounded-xl" />
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 landscape:grid-cols-3 gap-4 md:gap-6 landscape:gap-3">
               <Skeleton className="h-[120px] landscape:h-[90px] rounded-xl" />
               <Skeleton className="h-[120px] landscape:h-[90px] rounded-xl" />
               <Skeleton className="h-[120px] landscape:h-[90px] rounded-xl" />
             </div>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4 md:space-y-6 landscape:space-y-3">
            
            {/* TOP SECTION: Overview */}
            <motion.div variants={itemVariants}>
              <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden relative rounded-xl landscape:rounded-lg">
                <div className="absolute top-0 right-0 p-8 landscape:p-4 opacity-10 pointer-events-none hidden sm:block">
                  <DollarSign className="w-64 h-64 landscape:w-40 landscape:h-40 transform rotate-12 -translate-y-12 translate-x-12 landscape:-translate-y-6 landscape:translate-x-6" />
                </div>
                <CardContent className="p-6 md:p-10 landscape:p-4 relative z-10">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 landscape:gap-4 items-center">
                      <div className="space-y-3 md:space-y-4 landscape:space-y-2">
                         <h3 className="text-white/90 font-semibold text-xs md:text-sm tracking-wide uppercase flex items-center gap-2">
                            <Activity className="w-4 h-4 md:w-5 md:h-5 text-white" /> {t('admin.dashboard.today_revenue')}
                         </h3>
                         <div className="flex flex-col sm:flex-row sm:items-baseline gap-3 md:gap-4 landscape:gap-2">
                            <h2 className="text-4xl md:text-5xl lg:text-6xl landscape:text-3xl font-bold tracking-tight">
                               {formatCurrency(todayStats.revenue)}
                            </h2>
                            <div className={`inline-flex w-fit items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 landscape:px-2 landscape:py-0.5 rounded-md text-xs md:text-sm landscape:text-xs font-semibold ${comparison.isPositive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                               {comparison.isPositive ? <TrendingUp className="w-3 h-3 md:w-4 md:h-4 landscape:w-3 landscape:h-3" /> : <TrendingDown className="w-3 h-3 md:w-4 md:h-4 landscape:w-3 landscape:h-3" />}
                               <span>{Math.abs(comparison.percentageChange)}% <span className="hidden sm:inline landscape:hidden">{t('admin.dashboard.vs_yesterday')}</span></span>
                            </div>
                         </div>
                         <p className="text-white/80 text-xs md:text-sm font-medium">
                            {formatCurrency(comparison.yesterdayRevenue)} {t('admin.dashboard.vs_yesterday')}
                         </p>
                      </div>

                      <div className="flex flex-row flex-wrap gap-3 md:gap-4 landscape:gap-2 lg:justify-end">
                          <div className="bg-white/10 rounded-xl landscape:rounded-lg p-4 md:p-5 landscape:p-3 flex-1 lg:flex-none min-w-[100px] md:min-w-[140px] landscape:min-w-[110px]">
                             <div className="flex items-center gap-1.5 md:gap-2 text-white/90 mb-1.5 md:mb-2 landscape:mb-1">
                                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 landscape:w-4 landscape:h-4" />
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">{t('admin.dashboard.completed')}</span>
                             </div>
                             <span className="text-2xl md:text-3xl landscape:text-xl font-bold">{todayStats.completed}</span>
                          </div>
                          <div className="bg-white/10 rounded-xl landscape:rounded-lg p-4 md:p-5 landscape:p-3 flex-1 lg:flex-none min-w-[100px] md:min-w-[140px] landscape:min-w-[110px]">
                             <div className="flex items-center gap-1.5 md:gap-2 text-white/90 mb-1.5 md:mb-2 landscape:mb-1">
                                <Clock className="w-4 h-4 md:w-5 md:h-5 landscape:w-4 landscape:h-4" />
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">{t('admin.dashboard.pending')}</span>
                             </div>
                             <span className="text-2xl md:text-3xl landscape:text-xl font-bold">{todayStats.pending}</span>
                          </div>
                          <div className="bg-white/10 rounded-xl landscape:rounded-lg p-4 md:p-5 landscape:p-3 flex-1 lg:flex-none min-w-[100px] md:min-w-[140px] landscape:min-w-[110px]">
                             <div className="flex items-center gap-1.5 md:gap-2 text-white/90 mb-1.5 md:mb-2 landscape:mb-1">
                                <X className="w-4 h-4 md:w-5 md:h-5 landscape:w-4 landscape:h-4" />
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">{t('admin.dashboard.cancelled')}</span>
                             </div>
                             <span className="text-2xl md:text-3xl landscape:text-xl font-bold">{todayStats.cancelled}</span>
                          </div>
                      </div>
                   </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 landscape:grid-cols-3 gap-4 md:gap-6 landscape:gap-3">
              <motion.div variants={itemVariants}>
                <Card>
                   <CardContent className="p-4 md:p-6 landscape:p-3">
                     <div className="flex items-center gap-4 landscape:gap-2">
                       <div className="p-3 md:p-4 landscape:p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                         <ShoppingBag className="h-5 w-5 md:h-6 md:w-6 landscape:h-4 landscape:w-4" />
                       </div>
                       <div>
                         <p className="text-xs md:text-sm landscape:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('admin.dashboard.order_volume')}</p>
                         <h3 className="text-2xl md:text-3xl landscape:text-xl font-bold text-foreground">{todayStats.count}</h3>
                       </div>
                     </div>
                   </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                   <CardContent className="p-4 md:p-6 landscape:p-3">
                     <div className="flex items-center gap-4 landscape:gap-2">
                       <div className="p-3 md:p-4 landscape:p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                         <DollarSign className="h-5 w-5 md:h-6 md:w-6 landscape:h-4 landscape:w-4" />
                       </div>
                       <div>
                         <p className="text-xs md:text-sm landscape:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('admin.dashboard.avg_basket')}</p>
                         <h3 className="text-2xl md:text-3xl landscape:text-xl font-bold text-foreground">{formatCurrency(todayStats.avgOrderValue)}</h3>
                       </div>
                     </div>
                   </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-1 landscape:col-span-1">
                <Card>
                   <CardContent className="p-4 md:p-6 landscape:p-3">
                     <div className="flex items-center gap-4 landscape:gap-2">
                       <div className="p-3 md:p-4 landscape:p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                         <CheckCircle className="h-5 w-5 md:h-6 md:w-6 landscape:h-4 landscape:w-4" />
                       </div>
                       <div>
                         <p className="text-xs md:text-sm landscape:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('admin.dashboard.completion_rate')}</p>
                         <h3 className="text-2xl md:text-3xl landscape:text-xl font-bold text-foreground">
                           {todayStats.count > 0 ? Math.round((todayStats.completed / todayStats.count) * 100) : 0}%
                         </h3>
                       </div>
                     </div>
                   </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* BOTTOM SECTION: Analytics & Live Feed (2 columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 landscape:gap-3">
              <motion.div variants={itemVariants} className="h-full">
                <Card className="h-full min-h-[400px]">
                  <CardHeader className="border-b pb-4">
                    <CardTitle className="text-base md:text-lg">{t('admin.dashboard.revenue_7_days')}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                         <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                         <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                         <Tooltip cursor={{fill: 'hsl(var(--muted))'}} formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px', fontWeight: '500' }} />
                         <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="h-full">
                <Card className="h-full flex flex-col min-h-[400px]">
                  <CardHeader className="border-b pb-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base md:text-lg">{t('admin.dashboard.live_feed')}</CardTitle>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 p-0 overflow-hidden relative">
                    <div className="absolute inset-0 overflow-y-auto">
                      <LiveFeed />
                    </div>
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

export default AdminDashboard;