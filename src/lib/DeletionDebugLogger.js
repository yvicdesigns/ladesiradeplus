class DeletionDebugLogger {
  constructor() {
    this.logs = [];
    this.listeners = new Set();
    this.maxLogs = 50;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  log(message, data = null, functionName = 'unknown') {
    let safeData = null;
    if (data !== null && data !== undefined) {
      try {
        // Attempt to safely stringify and parse to avoid circular references
        safeData = JSON.parse(JSON.stringify(data, Object.getOwnPropertyNames(data)));
      } catch (e) {
        safeData = "[Unserializable Data]";
      }
    }

    const logEntry = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      functionName,
      message,
      data: safeData
    };

    // Console output for standard DevTools debugging
    const consoleMsg = `[DELETE_DEBUG] [${logEntry.timestamp}] [${functionName}] ${message}`;
    if (message.toLowerCase().includes('error')) {
      console.error(consoleMsg, data);
    } else {
      console.log(consoleMsg, data ? data : '');
    }

    this.logs.unshift(logEntry); // newest first

    // Keep max 50 logs
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    this.notify();
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    this.notify();
    console.log('[DELETE_DEBUG] Logs cleared.');
  }

  exportLogs() {
    const dataStr = JSON.stringify(this.logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deletion_debug_logs_${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const deletionDebugLogger = new DeletionDebugLogger();