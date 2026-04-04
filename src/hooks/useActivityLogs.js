import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { fetchWithTimeout } from '@/lib/timeoutUtils';
import { getFromCache, setInCache } from '@/lib/cacheUtils';
import { TIMEOUT_CONFIG } from '@/lib/timeoutConfig';

export const useActivityLogs = (initialPage = 1, initialLimit = 50) => {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    actionType: '',
    tableName: '', // Remplacé entityType par tableName
    userId: '',
    search: ''
  });

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit); 

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    const cacheKey = `audit_logs_p${page}_l${limit}_${JSON.stringify(filters)}`;
    
    const cached = getFromCache(cacheKey);
    if (cached) {
      setLogs(cached.logs);
      setTotalCount(cached.totalCount);
      setLoading(false);
    }

    try {
      // CORRECTION: Requête vers audit_logs et utilisation de old_data au lieu de details
      let query = supabase
        .from('audit_logs')
        .select('id, user_id, action, table_name, record_id, created_at, old_data, reason, ip_address', { count: 'exact' });

      if (filters.actionType) query = query.eq('action', filters.actionType);
      if (filters.tableName) query = query.eq('table_name', filters.tableName);
      if (filters.userId) query = query.eq('user_id', filters.userId);

      if (filters.search) {
        query = query.or(`record_id.eq.${filters.search},user_id.eq.${filters.search}`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data: logsData, count, error: err } = await fetchWithTimeout(
        query.order('created_at', { ascending: false }).range(from, to),
        TIMEOUT_CONFIG.FETCH_TIMEOUT
      );

      if (err) throw err;

      if (!logsData || logsData.length === 0) {
        setLogs([]);
        setTotalCount(0);
        setInCache(cacheKey, { logs: [], totalCount: 0 }, 2);
        return;
      }

      const userIds = [...new Set(logsData.map(log => log.user_id).filter(Boolean))];
      let profilesMap = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, email, full_name')
          .in('user_id', userIds);
          
        if (profilesData) {
          profilesData.forEach(profile => { profilesMap[profile.user_id] = profile; });
        }
      }

      const enrichedLogs = logsData.map(log => ({
        ...log,
        profiles: profilesMap[log.user_id] || null,
        user_email: profilesMap[log.user_id]?.email || 'Système'
      }));

      setLogs(enrichedLogs);
      setTotalCount(count || 0);
      setInCache(cacheKey, { logs: enrichedLogs, totalCount: count || 0 }, 2);

    } catch (err) {
      console.error(err);
      if (!cached) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, totalCount, loading, error, page, limit, filters, setPage, setLimit, setFilters, refresh: fetchLogs };
};