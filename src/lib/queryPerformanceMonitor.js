/**
 * In-memory store for tracking Supabase query performance.
 */
class QueryPerformanceMonitor {
  constructor() {
    this.logs = [];
    this.maxLogs = 500;
    this.listeners = new Set();
  }

  addLog(logEntry) {
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    this.notifyListeners();
  }

  getLogs() {
    return [...this.logs];
  }

  getMetrics() {
    const total = this.logs.length;
    const timeouts = this.logs.filter(l => l.status === 'timeout').length;
    const errors = this.logs.filter(l => l.status === 'error').length;
    const avgDuration = total > 0 
      ? this.logs.reduce((acc, l) => acc + l.durationMs, 0) / total 
      : 0;

    return { total, timeouts, errors, avgDuration: Math.round(avgDuration) };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.getLogs(), this.getMetrics()));
  }

  clear() {
    this.logs = [];
    this.notifyListeners();
  }
}

export const queryMonitor = new QueryPerformanceMonitor();

/**
 * Wraps an async function to measure its execution time and log it.
 */
export const trackQuery = async (queryName, queryFn) => {
  const start = performance.now();
  let status = 'success';
  let errorDetails = null;

  try {
    const result = await queryFn();
    return result;
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.message?.includes('timeout')) {
      status = 'timeout';
    } else {
      status = 'error';
    }
    errorDetails = error?.message || 'Unknown error';
    throw error;
  } finally {
    const end = performance.now();
    const durationMs = Math.round(end - start);
    
    queryMonitor.addLog({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      queryName,
      durationMs,
      status,
      error: errorDetails
    });
  }
};