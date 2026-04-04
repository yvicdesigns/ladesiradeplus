/**
 * Centralized constants for audit_logs 'action' column.
 * MUST exactly match the PostgreSQL CHECK constraint:
 * CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'RESTORE', 'SYSTEM_CLEANUP', 'EXPORT', 'LOGIN', 'LOGOUT'))
 */
export const AUDIT_ACTIONS = {
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  RESTORE: 'RESTORE',
  SYSTEM_CLEANUP: 'SYSTEM_CLEANUP',
  EXPORT: 'EXPORT',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT'
};

export default AUDIT_ACTIONS;