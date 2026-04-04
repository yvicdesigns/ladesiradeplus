import { getQuarterByName } from './BrazzavilleQuarters';

// Coordinates for Nkombo (Restaurant Location)
export const NKOMBO_COORDINATES = {
  latitude: -4.20621,
  longitude: 15.24330
};

const NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/search';
const OSRM_API_URL = 'https://router.project-osrm.org/route/v1/driving';

export const DeliveryDistanceService = {
  /**
   * Appends context to address for better geocoding results
   * @param {string} address 
   * @returns {string}
   */
  appendBrazzavilleCongo(address) {
    if (!address) return "";
    // Avoid double appending if user already typed it
    if (address.toLowerCase().includes("brazzaville")) return address;
    return `${address}, Brazzaville, Congo`;
  },

  /**
   * Gets coordinates for a quarter if address lookup fails
   * @param {string} quarterName 
   * @returns {{latitude: number, longitude: number, name: string, fee: number}|null}
   */
  getQuarterFallback(quarterName) {
    const quarter = getQuarterByName(quarterName);
    if (quarter) {
      return {
        ...quarter.coordinates,
        name: quarter.name,
        fee: quarter.fee // Ensure we include the explicit predefined fee
      };
    }
    return null;
  },

  /**
   * Calculates distance between two points using Haversine formula
   * @param {object} coords1 {latitude, longitude}
   * @param {object} coords2 {latitude, longitude}
   * @returns {number} Distance in km
   */
  calculateHaversineDistance(coords1, coords2) {
    if (!coords1 || !coords2) return 0;

    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(coords2.latitude - coords1.latitude);
    const dLon = this.deg2rad(coords2.longitude - coords1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(coords1.latitude)) * Math.cos(this.deg2rad(coords2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  },

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  },

  /**
   * Returns distance from Nkombo using Haversine formula
   * @param {object} coordinates {latitude, longitude}
   * @returns {number} Distance in km
   */
  getDistanceFromNkombo(coordinates) {
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) return 0;
    return this.calculateHaversineDistance(NKOMBO_COORDINATES, coordinates);
  },

  /**
   * Calculates fee based on distance
   * @param {number} distanceKm 
   * @returns {{fee: number, isAvailable: boolean, message: string, tier: string}}
   */
  calculateDeliveryFeeByDistance(distanceKm) {
    if (distanceKm === null || distanceKm === undefined || distanceKm < 0) {
      return { fee: 0, isAvailable: false, message: "Distance invalide", tier: "N/A" };
    }

    // Round to 1 decimal for stability
    const dist = parseFloat(distanceKm.toFixed(1));

    if (dist <= 10) {
        return { fee: 1000, isAvailable: true, message: "Zone 1 (0-10km)", tier: "0-10km" };
    } else if (dist <= 20) {
        return { fee: 2000, isAvailable: true, message: "Zone 2 (10-20km)", tier: "10-20km" };
    } else {
        // 20+ km
        return { fee: 3000, isAvailable: true, message: "Zone 3 (20km+)", tier: "20km+" };
    }
  },

  /**
   * Geocodes an address string to coordinates using OpenStreetMap Nominatim
   * @param {string} address - Full address string
   * @returns {Promise<{latitude: number, longitude: number, displayName: string}|null>}
   */
  async geocodeAddress(address) {
    if (!address) return null;
    
    // Use the hybrid approach: Append context automatically
    const searchAddress = this.appendBrazzavilleCongo(address);
    
    try {
      // Bounding box for Brazzaville/Nkombo area to improve accuracy
      const viewbox = '15.0,-4.5,15.5,-4.0'; 
      
      const url = `${NOMINATIM_API_URL}?format=json&q=${encodeURIComponent(searchAddress)}&limit=1&viewbox=${viewbox}&bounded=0`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'LaDesiadePlusDeliveryApp/1.0' 
        }
      });

      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          displayName: data[0].display_name
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  },
  
  /**
   * Unified calculation method
   */
  async calculateFeeFromQuarter(quarterName) {
      const quarterData = this.getQuarterFallback(quarterName);
      if (!quarterData) return null;

      const distance = this.getDistanceFromNkombo(quarterData);
      
      // Use explicit fee from quarter data if available, otherwise fallback to distance-based calculation
      const feeInfo = quarterData.fee 
          ? { fee: quarterData.fee, isAvailable: true, message: `Forfait Quartier ${quarterName}`, tier: `Quartier ${quarterName}` }
          : this.calculateDeliveryFeeByDistance(distance);

      return {
          ...feeInfo,
          distance: parseFloat(distance.toFixed(2)),
          address: `Quartier ${quarterName}, Brazzaville`,
          quarterName: quarterName,
          coordinates: { latitude: quarterData.latitude, longitude: quarterData.longitude }
      };
  }
};