import { DeliveryDistanceService } from './DeliveryDistanceService';

/**
 * Calculates delivery fee based on distance from NKOMBO.
 * Pricing Tiers:
 * - 0-10km: 1000 CFA
 * - 10-20km: 2000 CFA
 * - 20km+: 3000 CFA
 * 
 * @param {number} distanceKm 
 * @returns {{fee: number, tier: string, isAvailable: boolean, message: string}}
 */
export const calculateDeliveryFeeByDistance = (distanceKm) => {
  return DeliveryDistanceService.calculateDeliveryFeeByDistance(distanceKm);
};

// Wrapper for backward compatibility if used elsewhere
export const calculateDeliveryFee = (distanceKm) => {
  return calculateDeliveryFeeByDistance(distanceKm);
};