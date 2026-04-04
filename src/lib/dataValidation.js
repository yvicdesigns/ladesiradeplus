/**
 * Utility functions to guarantee data types and prevent "not iterable" errors.
 */

export const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data === undefined || data === null) return [];
  
  if (typeof data === 'object') {
    console.warn('[dataValidation] ensureArray received non-array object. Converting values to array:', data);
    return Object.values(data);
  }
  
  console.warn('[dataValidation] ensureArray received primitive type. Returning empty array. Received:', typeof data);
  return [];
};

export const ensureObject = (data) => {
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) return data;
  console.warn('[dataValidation] ensureObject received invalid data. Returning empty object. Received:', typeof data);
  return {};
};

export const ensureString = (data) => {
  if (typeof data === 'string') return data;
  if (data === undefined || data === null) return '';
  return String(data);
};