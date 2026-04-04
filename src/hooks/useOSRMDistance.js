import { useState, useCallback } from 'react';
import { DeliveryDistanceService } from '@/lib/DeliveryDistanceService';

export const useOSRMDistance = () => {
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateDistance = useCallback(async (latitude, longitude) => {
    setLoading(true);
    setError(null);
    try {
      const dist = await DeliveryDistanceService.calculateDistanceFromNkombo(latitude, longitude);
      if (dist !== null) {
        setDistance(dist);
        return dist;
      } else {
        setError("Impossible de calculer la distance via OSRM");
        return null;
      }
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion au service de calcul");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { distance, loading, error, calculateDistance };
};