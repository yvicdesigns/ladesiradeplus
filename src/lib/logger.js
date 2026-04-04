/**
 * Advanced logger utility to ensure consistent console output
 * and capture a ring buffer of logs for diagnostic reports.
 */

const isDev = import.meta.env.DEV;
const isDebug = import.meta.env.VITE_DEBUG_MODE === 'true';
const shouldLogDebug = isDev || isDebug;

export const logBuffer = [];
const MAX_LOGS = 50;

const captureLog = (level, args) => {
  try {
    const message = args.map(a => {
      if (a instanceof Error) return a.stack || a.message;
      if (typeof a === 'object') return JSON.stringify(a);
      return String(a);
    }).join(' ');

    logBuffer.push({ time: new Date().toISOString(), level, message });
    if (logBuffer.length > MAX_LOGS) {
      logBuffer.shift();
    }
  } catch (e) {
    // Ignore stringify errors in logger
  }
};

export const logger = {
  info: (...args) => {
    console.log(`[INFO] ${new Date().toISOString()}:`, ...args);
    captureLog('INFO', args);
  },
  warn: (...args) => {
    console.warn(`[WARN] ${new Date().toISOString()}:`, ...args);
    captureLog('WARN', args);
  },
  error: (...args) => {
    console.error(`[ERROR] ${new Date().toISOString()}:`, ...args);
    captureLog('ERROR', args);
  },
  debug: (...args) => {
    if (shouldLogDebug) {
      console.debug(`[DEBUG] ${new Date().toISOString()}:`, ...args);
    }
    captureLog('DEBUG', args);
  },
  getRecentLogs: () => [...logBuffer],
  clearLogs: () => { logBuffer.length = 0; }
};