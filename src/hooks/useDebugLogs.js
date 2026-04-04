import { useState, useEffect, useCallback } from 'react';
import { debugLogger, LOG_EVENTS } from '@/lib/debugLogger';

export function useDebugLogs() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    type: 'ALL',
    level: 'ALL',
    search: ''
  });

  useEffect(() => {
    // Initial load
    setLogs(debugLogger.getLogs());

    // Subscribe to updates
    const unsubscribe = debugLogger.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });

    return unsubscribe;
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesType = filters.type === 'ALL' || log.type === filters.type;
    const matchesLevel = filters.level === 'ALL' || log.level === filters.level;
    const matchesSearch = filters.search === '' || 
      log.message.toLowerCase().includes(filters.search.toLowerCase()) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(filters.search.toLowerCase()));
      
    return matchesType && matchesLevel && matchesSearch;
  });

  const clearLogs = useCallback(() => {
    debugLogger.clear();
  }, []);

  const exportLogs = useCallback(() => {
    debugLogger.exportLogs();
  }, []);

  const addLog = useCallback((type, message, details) => {
    debugLogger.log(type, message, details);
  }, []);

  return {
    logs: filteredLogs,
    allLogs: logs,
    filters,
    setFilters,
    clearLogs,
    exportLogs,
    addLog,
    LOG_EVENTS
  };
}