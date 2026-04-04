import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { subDays, format, parseISO } from 'date-fns';
import { fetchWithTimeout } from '@/lib/timeoutUtils';
import { TIMEOUT_CONFIG } from '@/lib/timeoutConfig';

export const useAnalytics = (period = '30d') => {
  const [data, setData] = useState({
    kpis: { totalOrders: 0, totalRevenue: 0, totalCustomers: 0, totalRestaurants: 0, conversionRate: 0, avgOrderValue: 0 },
    charts: { revenueTrend: [], ordersTrend: [], typeDistribution: [], statusDistribution: [], topClients: [], topRestaurants: [] }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      let startDate = subDays(now, 30);
      if (period === '7d') startDate = subDays(now, 7);
      if (period === '90d') startDate = subDays(now, 90);
      if (period === 'year') startDate = subDays(now, 365);

      const query = supabase
        .from('orders')
        .select('id, total, created_at, status, type, customer_name')
        .gte('created_at', startDate.toISOString())
        .neq('status', 'cancelled')
        .limit(2000); 

      const { data: orders, error: err } = await fetchWithTimeout(query, TIMEOUT_CONFIG.FETCH_TIMEOUT); 

      if (err) throw err;

      if (!orders || orders.length === 0) {
          setData({
            kpis: { totalOrders: 0, totalRevenue: 0, totalCustomers: 0, totalRestaurants: 0, conversionRate: 0, avgOrderValue: 0 },
            charts: { revenueTrend: [], ordersTrend: [], typeDistribution: [], statusDistribution: [], topClients: [], topRestaurants: [] }
          });
          setLoading(false);
          return;
      }

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const uniqueCustomers = new Set(orders.map(o => o.customer_name)).size;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const trendMap = {};
      orders.forEach(order => {
        const day = format(parseISO(order.created_at), 'yyyy-MM-dd');
        if (!trendMap[day]) trendMap[day] = { date: day, revenue: 0, orders: 0 };
        trendMap[day].revenue += Number(order.total) || 0;
        trendMap[day].orders += 1;
      });
      const revenueTrend = Object.values(trendMap).sort((a,b) => a.date.localeCompare(b.date));

      const statusMap = {};
      orders.forEach(o => {
        const status = o.status || 'unknown';
        statusMap[status] = (statusMap[status] || 0) + 1;
      });
      const statusDistribution = Object.keys(statusMap).map(key => ({ name: key, value: statusMap[key] }));

      const typeMap = {};
      orders.forEach(o => {
          const type = o.type || 'standard';
          typeMap[type] = (typeMap[type] || 0) + 1;
      });
      const typeDistribution = Object.keys(typeMap).map(key => ({ name: key, value: typeMap[key] }));

      setData({
        kpis: { totalOrders, totalRevenue, totalCustomers: uniqueCustomers, totalRestaurants: 0, conversionRate: 0, avgOrderValue },
        charts: { revenueTrend, ordersTrend: revenueTrend, statusDistribution, typeDistribution, topClients: [], topRestaurants: [] }
      });

    } catch (error) {
      console.error("Analytics fetch error:", error);
      setError(error.message || "Erreur lors du chargement des analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  return { data, loading, error, refresh: fetchAnalytics };
};