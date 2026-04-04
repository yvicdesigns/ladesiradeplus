import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { executeWithResilience } from '@/lib/supabaseErrorHandler';

export const useAuditLogs = (filters = {}, pagination = { page: 1, limit: 20 }) => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ totalDeletions: 0, totalRestorations: 0, topUser: 'N/A', topTable: 'N/A' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const filtersRef = useRef(filters);
  const paginationRef = useRef(pagination);

  useEffect(() => {
    filtersRef.current = filters;
    paginationRef.current = pagination;
  }, [filters, pagination]);

  const fetchStats = async () => {
    try {
      const { data } = await executeWithResilience(async () => {
        const res = await supabase.from('audit_logs').select('action, table_name, user_id');
        if (res.error) throw res.error;
        return res;
      });

      if (!data) return;

      let deletions = 0;
      let restorations = 0;
      const userCounts = {};
      const tableCounts = {};

      data.forEach(log => {
        if (log.action?.toUpperCase() === 'DELETE') deletions++;
        if (log.action?.toUpperCase() === 'RESTORE') restorations++;
        
        if (log.action?.toUpperCase() === 'DELETE') {
          if (log.user_id) userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
          if (log.table_name) tableCounts[log.table_name] = (tableCounts[log.table_name] || 0) + 1;
        }
      });

      let topUserId = null;
      let maxUserCount = 0;
      Object.entries(userCounts).forEach(([uid, count]) => {
        if (count > maxUserCount) { maxUserCount = count; topUserId = uid; }
      });

      let topTable = 'N/A';
      let maxTableCount = 0;
      Object.entries(tableCounts).forEach(([tbl, count]) => {
        if (count > maxTableCount) { maxTableCount = count; topTable = tbl; }
      });

      let topUserEmail = 'N/A';
      if (topUserId) {
        const { data: profile } = await supabase.from('profiles').select('email').eq('id', topUserId).maybeSingle();
        if (profile) topUserEmail = profile.email;
      }

      setStats({
        totalDeletions: deletions,
        totalRestorations: restorations,
        topUser: topUserEmail,
        topTable: topTable
      });
    } catch (err) {
      console.error("Failed to fetch audit stats:", err);
    }
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const currentFilters = filtersRef.current;
      const { page, limit } = paginationRef.current;

      const { data, count } = await executeWithResilience(async () => {
        let query = supabase.from('audit_logs').select('*', { count: 'exact' });

        if (currentFilters.action && currentFilters.action !== 'all') {
          query = query.eq('action', currentFilters.action.toUpperCase());
        }
        if (currentFilters.tableName && currentFilters.tableName !== 'all') {
          query = query.eq('table_name', currentFilters.tableName);
        }
        if (currentFilters.userId && currentFilters.userId !== 'all') {
          query = query.eq('user_id', currentFilters.userId);
        }
        if (currentFilters.dateFrom) {
          query = query.gte('created_at', currentFilters.dateFrom);
        }
        if (currentFilters.dateTo) {
          // Add 1 day to include the end date fully
          const toDate = new Date(currentFilters.dateTo);
          toDate.setDate(toDate.getDate() + 1);
          query = query.lt('created_at', toDate.toISOString());
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        query = query.order('created_at', { ascending: false }).range(from, to);

        const res = await query;
        if (res.error) throw res.error;
        return res;
      });

      let enrichedData = data || [];

      // Join profiles for emails
      const userIds = [...new Set(enrichedData.map(l => l.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, email').in('user_id', userIds);
        if (profiles) {
          enrichedData = enrichedData.map(log => {
            const profile = profiles.find(p => p.user_id === log.user_id);
            return { ...log, user_email: profile?.email || 'System / Unknown' };
          });
        }
      }

      setLogs(enrichedData);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("[useAuditLogs] Fetch Error:", err);
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchStats();

    const channel = supabase.channel('audit_logs_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => {
        fetchLogs();
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs]);

  return {
    logs,
    stats,
    loading,
    error,
    totalCount,
    currentPage: pagination.page,
    totalPages: Math.ceil(totalCount / pagination.limit),
    refetch: fetchLogs
  };
};