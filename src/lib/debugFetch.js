export const fetchLogs = [];
const MAX_LOGS = 100;

export const logFetchAttempt = (url, method = 'GET', options = {}) => {
  const logEntry = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString(),
    type: 'ATTEMPT',
    url,
    method,
    ...options
  };
  
  fetchLogs.unshift(logEntry);
  if (fetchLogs.length > MAX_LOGS) fetchLogs.pop();
  return logEntry.id;
};

export const logFetchSuccess = (id, duration, status, extra = {}) => {
  const logEntry = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString(),
    type: 'SUCCESS',
    relatedId: id,
    duration,
    status,
    ...extra
  };
  
  fetchLogs.unshift(logEntry);
  if (fetchLogs.length > MAX_LOGS) fetchLogs.pop();
};

export const logFetchError = (id, errorType, message, extra = {}) => {
  const logEntry = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString(),
    type: 'ERROR',
    relatedId: id,
    errorType,
    message,
    ...extra
  };
  
  fetchLogs.unshift(logEntry);
  if (fetchLogs.length > MAX_LOGS) fetchLogs.pop();
};

export const getFetchLogs = () => {
  return [...fetchLogs];
};

export const clearFetchLogs = () => {
  fetchLogs.length = 0;
};