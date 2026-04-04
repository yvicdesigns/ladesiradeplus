/**
 * Calculates delivery fee based on distance in kilometers.
 * Tiers:
 * - 0-10km: 1000 CFA
 * - 10-20km: 2000 CFA
 * - 20km+: 3000 CFA
 * 
 * @param {number} distanceKm 
 * @returns {{fee: number, tier: string}}
 */
export const calculateDeliveryFeeByDistance = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined || distanceKm < 0) {
    return { fee: 0, tier: "N/A" };
  }

  // Round to 1 decimal for consistency
  const dist = parseFloat(distanceKm.toFixed(1));

  if (dist <= 10) {
    return { fee: 1000, tier: "0-10km" };
  } else if (dist <= 20) {
    return { fee: 2000, tier: "10-20km" };
  } else {
    return { fee: 3000, tier: "20km+" };
  }
};