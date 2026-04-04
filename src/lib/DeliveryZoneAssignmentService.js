import { supabase } from '@/lib/customSupabaseClient';

/**
 * Service to handle delivery zone assignment logic
 */
export const DeliveryZoneAssignmentService = {
  
  /**
   * Matches an address/city to a delivery zone
   * @param {string} address - The customer's address line
   * @param {string} city - The customer's city
   * @returns {Promise<Object|null>} - The matched zone object or null
   */
  async matchZone(address, city) {
    if (!address && !city) return null;

    try {
      // Fetch all zones if not cached (for this service utility, we fetch fresh)
      // Ideally this should be cached or passed in, but for robustness we query.
      const { data: zones, error } = await supabase
        .from('delivery_zones')
        .select('*');

      if (error || !zones) {
        console.error('Error fetching zones for assignment:', error);
        return null;
      }

      // Normalize inputs
      const normalize = (str) => str ? str.toLowerCase().trim() : '';
      const normCity = normalize(city);
      const normAddress = normalize(address);

      // Strategy 1: City Match
      // Check if the provided city matches a zone name exactly
      let matchedZone = zones.find(z => normalize(z.name) === normCity);

      // Strategy 2: Partial City Match
      if (!matchedZone && normCity) {
        matchedZone = zones.find(z => normalize(z.name).includes(normCity) || normCity.includes(normalize(z.name)));
      }

      // Strategy 3: Address Content Match
      // Check if the address string contains the zone name
      if (!matchedZone && normAddress) {
        matchedZone = zones.find(z => normAddress.includes(normalize(z.name)));
      }

      return matchedZone || null;
    } catch (err) {
      console.error('DeliveryZoneAssignmentService error:', err);
      return null;
    }
  },

  /**
   * Calculates delivery fee based on zone
   * @param {Object} zone - The zone object
   * @returns {number} - The delivery fee
   */
  calculateFee(zone) {
    if (!zone) return 0; // Default or fallback fee could be handled here
    return Number(zone.delivery_fee) || 0;
  }
};