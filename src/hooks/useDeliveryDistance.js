import { useState, useCallback } from 'react';
import { DeliveryDistanceService } from '@/lib/DeliveryDistanceService';

export const useDeliveryDistance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [distanceInfo, setDistanceInfo] = useState({
    distance: null,
    fee: null,
    isAvailable: true,
    message: '',
    tier: null
  });

  // Simple cache to prevent redundant calls
  const [cache, setCache] = useState({});

  const calculateFees = useCallback(async (address) => {
    if (!address) {
      setDistanceInfo({ distance: null, fee: null, isAvailable: true, message: '', tier: null });
      return null;
    }

    // Check cache
    if (cache[address]) {
      setDistanceInfo(cache[address]);
      return cache[address];
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Geocode
      const coords = await DeliveryDistanceService.geocodeAddress(address);
      
      if (!coords) {
        throw new Error("Impossible de localiser cette adresse");
      }

      // 2. Calculate Distance (Using Haversine for pricing consistency as per new rules)
      const distanceKm = DeliveryDistanceService.getDistanceFromNkombo(coords);

      // 3. Get Fee
      const feeInfo = DeliveryDistanceService.calculateDeliveryFeeByDistance(distanceKm);

      const result = {
        distance: parseFloat(distanceKm.toFixed(2)),
        fee: feeInfo.fee,
        isAvailable: feeInfo.isAvailable,
        message: feeInfo.message,
        tier: feeInfo.tier,
        coordinates: coords,
        address: coords.displayName // Store the formatted address
      };

      setCache(prev => ({ ...prev, [address]: result }));
      setDistanceInfo(result);
      return result;

    } catch (err) {
      console.error('Distance hook error:', err);
      const errorResult = {
        distance: null,
        fee: null,
        isAvailable: false,
        message: err.message || "Erreur inconnue",
        tier: null
      };
      setDistanceInfo(errorResult);
      setError(err.message);
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, [cache]);

  return {
    loading,
    error,
    distanceInfo,
    calculateFees,
    setDistanceInfo, // Allow manual setting if needed
    reset: () => setDistanceInfo({ distance: null, fee: null, isAvailable: true, message: '', tier: null })
  };
};