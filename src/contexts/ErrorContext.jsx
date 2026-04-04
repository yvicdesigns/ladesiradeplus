import React, { createContext, useContext, useState, useCallback } from 'react';
import { handleError, logError, showErrorToUser } from '@/lib/errorHandler';

const ErrorContext = createContext(null);

export const ErrorProvider = ({ children }) => {
  const [globalErrors, setGlobalErrors] = useState([]);

  const reportError = useCallback((error, context = '') => {
    const errorType = handleError(error, context);
    setGlobalErrors(prev => [...prev, { id: Date.now(), error, context, type: errorType, time: new Date() }]);
  }, []);

  const clearErrors = useCallback(() => {
    setGlobalErrors([]);
  }, []);

  const removeError = useCallback((id) => {
    setGlobalErrors(prev => prev.filter(e => e.id !== id));
  }, []);

  return (
    <ErrorContext.Provider value={{ globalErrors, reportError, clearErrors, removeError }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) throw new Error('useError must be used within an ErrorProvider');
  return context;
};