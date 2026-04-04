import { supabase } from '@/lib/customSupabaseClient';

/**
 * debugLogger - A centralized logging utility for system maintenance and debugging
 * Stores logs in memory and (optionally) can sync to a backend or local storage
 */

export const LOG_EVENTS = {
  AUTH: 'AUTH',
  DATABASE: 'DATABASE',
  NETWORK: 'NETWORK',
  SYSTEM: 'SYSTEM',
  ERROR: 'ERROR',
  NAVIGATION: 'NAVIGATION',
  REALTIME: 'REALTIME'
};

const MAX_LOGS = 1000;
let memoryLogs = [];
let listeners = [];

const notifyListeners = () => {
  listeners.forEach(listener => listener(memoryLogs));
};

const createLogEntry = (level, type, message, details = null) => {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    level, // 'info', 'warn', 'error', 'success'
    type,  // One of LOG_EVENTS
    message,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
};

export const debugLogger = {
  log: (type, message, details = null) => {
    const entry = createLogEntry('info', type, message, details);
    memoryLogs = [entry, ...memoryLogs].slice(0, MAX_LOGS);
    console.log(`[${type}] ${message}`, details || '');
    notifyListeners();
    return entry;
  },

  info: (type, message, details = null) => {
    return debugLogger.log(type, message, details);
  },

  warn: (type, message, details = null) => {
    const entry = createLogEntry('warn', type, message, details);
    memoryLogs = [entry, ...memoryLogs].slice(0, MAX_LOGS);
    console.warn(`[${type}] ${message}`, details || '');
    notifyListeners();
    return entry;
  },

  error: (type, message, error = null) => {
    const details = error ? { 
      message: error.message, 
      stack: error.stack, 
      code: error.code 
    } : null;
    
    const entry = createLogEntry('error', type, message, details);
    memoryLogs = [entry, ...memoryLogs].slice(0, MAX_LOGS);
    console.error(`[${type}] ${message}`, error || '');
    notifyListeners();
    return entry;
  },

  success: (type, message, details = null) => {
    const entry = createLogEntry('success', type, message, details);
    memoryLogs = [entry, ...memoryLogs].slice(0, MAX_LOGS);
    console.log(`✅ [${type}] ${message}`, details || '');
    notifyListeners();
    return entry;
  },

  getLogs: () => [...memoryLogs],

  clear: () => {
    memoryLogs = [];
    notifyListeners();
  },

  subscribe: (listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },
  
  exportLogs: () => {
    const dataStr = JSON.stringify(memoryLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `debug-logs-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
};

debugLogger.info(LOG_EVENTS.SYSTEM, 'Debug logger initialized');