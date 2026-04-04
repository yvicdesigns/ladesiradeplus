class OrderStatusPerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.maxHistory = 100;
  }

  recordAttempt(orderId, targetStatus, durationMs, isSuccess, errorMsg = null) {
    const record = {
      timestamp: new Date().toISOString(),
      orderId,
      targetStatus,
      durationMs: Math.round(durationMs),
      isSuccess,
      errorMsg
    };

    this.metrics.unshift(record);
    if (this.metrics.length > this.maxHistory) {
      this.metrics.pop();
    }

    // In a real prod env, slow queries (>500ms) might be pushed to analytics
    if (durationMs > 500) {
      console.warn(`[Performance Warning] Order status update took ${Math.round(durationMs)}ms (Target: < 150ms)`, record);
    }
  }

  getStats() {
    if (this.metrics.length === 0) return { total: 0 };

    const total = this.metrics.length;
    const successes = this.metrics.filter(m => m.isSuccess).length;
    const errors = total - successes;
    
    const durations = this.metrics.filter(m => m.isSuccess).map(m => m.durationMs);
    const avgLatency = durations.length > 0 ? (durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    
    return {
      total,
      successRate: `${Math.round((successes / total) * 100)}%`,
      errorCount: errors,
      avgLatencyMs: Math.round(avgLatency),
      recentMetrics: this.metrics.slice(0, 10)
    };
  }
}

export const orderStatusPerformanceMonitor = new OrderStatusPerformanceMonitor();