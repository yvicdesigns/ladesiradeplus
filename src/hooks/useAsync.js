import { useState, useCallback, useEffect } from 'react';

/**
 * Hook pour gérer l'état d'une fonction asynchrone (chargement, erreur, succès)
 * @param {Function} asyncFunction La fonction asynchrone à exécuter
 * @param {boolean} immediate Si true, exécute la fonction immédiatement au montage
 */
export const useAsync = (asyncFunction, immediate = false) => {
  const [status, setStatus] = useState('idle'); // 'idle' | 'pending' | 'success' | 'error'
  const [value, setValue] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setStatus('pending');
      setValue(null);
      setError(null);

      try {
        const response = await asyncFunction(...args);
        setValue(response);
        setStatus('success');
        return response;
      } catch (err) {
        setError(err);
        setStatus('error');
        throw err;
      }
    },
    [asyncFunction]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { 
    execute, 
    status, 
    value, 
    error,
    isLoading: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error',
    isIdle: status === 'idle'
  };
};

export default useAsync;