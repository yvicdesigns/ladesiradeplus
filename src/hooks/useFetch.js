import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personnalisé pour simplifier la récupération de données
 * @param {Function} fetcher Fonction asynchrone retournant les données
 * @param {Array} dependencies Tableau de dépendances pour relancer le fetch
 */
export const useFetch = (fetcher, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      console.error('[useFetch Error]', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
};

export default useFetch;