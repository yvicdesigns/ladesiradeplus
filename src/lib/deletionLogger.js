class DeletionLogger {
  constructor() {
    this.logs = [];
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  addLog(type, message, data = null) {
    const log = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      message,
      data: data ? JSON.parse(JSON.stringify(data, Object.getOwnPropertyNames(data))) : null
    };
    
    // Console output for standard DevTools debugging
    let consoleMsg = `[DELETE LOG] [${log.timestamp}] ${message}`;
    if (type === 'ERROR') {
      console.error(consoleMsg, data);
    } else if (type === 'WARN') {
      console.warn(consoleMsg, data);
    } else {
      console.log(consoleMsg, data ? data : '');
    }

    this.logs.unshift(log); // newest first
    // Keep max 1000 logs
    if (this.logs.length > 1000) this.logs.pop();
    this.notify();
  }

  logDeleteClick(entityType, id) {
    this.addLog('INFO', `Delete button clicked for ${entityType} ID: ${id}`, { entityType, id });
  }

  logDeleteQuery(table, id, queryDetails = null) {
    const query = queryDetails || `DELETE FROM ${table} WHERE id = '${id}'`;
    this.addLog('QUERY', `Preparing to execute query on ${table}`, { table, id, query });
  }

  logSupabaseResponse(table, response) {
    this.addLog('RESPONSE', `Received response from Supabase for ${table}`, { 
      error: response.error, 
      data: response.data,
      status: response.status,
      statusText: response.statusText
    });
  }

  logDeleteSuccess(table, id, rowsAffected) {
    this.addLog('SUCCESS', `Successfully deleted from ${table}. Rows affected: ${rowsAffected}`, { table, id, rowsAffected });
  }

  logDeleteError(table, id, error) {
    this.addLog('ERROR', `Failed to delete from ${table} for ID: ${id}`, { 
      table, 
      id, 
      errorMessage: error?.message, 
      errorCode: error?.code,
      details: error?.details 
    });
  }

  logDataRefresh(component) {
    this.addLog('INFO', `Triggered data refresh in ${component}`);
  }

  logFinalCheck(table, id, exists, data) {
    this.addLog(exists ? 'WARN' : 'SUCCESS', `FINAL CHECK - Record ${exists ? 'STILL EXISTS' : 'DELETED'} in ${table} (ID: ${id})`, { table, id, exists, data });
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    this.notify();
  }
}

export const deletionLogger = new DeletionLogger();