import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { fetchWithTimeout } from '@/lib/timeoutUtils';
import { TIMEOUT_CONFIG } from '@/lib/timeoutConfig';
import { subDays } from 'date-fns';

export const useReports = (initialTab = 'orders', initialPeriod = '30d') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [period, setPeriod] = useState(initialPeriod);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const now = new Date();
      let startDate = subDays(now, 30);
      if (period === '7d') startDate = subDays(now, 7);
      if (period === '90d') startDate = subDays(now, 90);
      if (period === 'all') startDate = new Date(0);

      let query;
      if (activeTab === 'orders') {
        query = supabase
            .from('orders')
            .select('id, total, created_at, status, customer_name')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false })
            .limit(1000); 
      } else {
        query = supabase
            .from('reservations')
            .select('id, reservation_date, party_size, status, customer_name')
            .gte('reservation_date', startDate.toISOString()) 
            .order('reservation_date', { ascending: false })
            .limit(1000);
      }

      const { data: resultData, error: err } = await fetchWithTimeout(query, TIMEOUT_CONFIG.FETCH_TIMEOUT);
      
      if (err) throw err;
      
      setData(resultData || []);
    } catch (err) {
      console.error("Report fetch error:", err);
      setError(err.message || "Impossible de charger le rapport");
    } finally {
      setLoading(false);
    }
  }, [activeTab, period]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { data, loading, error, activeTab, setActiveTab, period, setPeriod, refresh: fetchReports };
};