class PollingService {
  constructor() {
    this.tasks = new Map();
    this.inFlightRequests = new Map();
  }

  // OPTIMIZATION: Default interval updated to 2 minutes (120000ms) to reduce server load
  startPolling(key, fetchFn, interval = 120000) {
    if (this.tasks.has(key)) {
      this.stopPolling(key);
    }

    const executePoll = async () => {
      // Deduplication: prevent overlapping requests for the same key
      if (this.inFlightRequests.get(key)) return;
      
      this.inFlightRequests.set(key, true);
      try {
        await fetchFn();
      } catch (error) {
        console.error(`[PollingService] Error polling for ${key}:`, error);
      } finally {
        this.inFlightRequests.set(key, false);
      }
    };

    // Execute immediately on start
    executePoll();
    const timerId = setInterval(executePoll, interval);
    this.tasks.set(key, { timerId, interval, fetchFn });
    
    return () => this.stopPolling(key);
  }

  stopPolling(key) {
    if (this.tasks.has(key)) {
      clearInterval(this.tasks.get(key).timerId);
      this.tasks.delete(key);
      this.inFlightRequests.delete(key);
    }
  }

  getPollingStatus() {
    const status = {};
    for (const [key, task] of this.tasks.entries()) {
      status[key] = {
        active: true,
        interval: task.interval,
        inFlight: !!this.inFlightRequests.get(key)
      };
    }
    return status;
  }
  
  stopAll() {
    for (const key of this.tasks.keys()) {
      this.stopPolling(key);
    }
  }
}

export const pollingService = new PollingService();