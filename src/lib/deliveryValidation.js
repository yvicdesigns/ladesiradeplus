import { supabase } from '@/lib/customSupabaseClient';

/**
 * Validates if a given string is a proper UUID.
 * @param {string} uuid - The string to validate
 * @returns {boolean} - True if valid UUID
 */
export const isValidUUID = (uuid) => {
  if (!uuid || typeof uuid !== 'string') return false;
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
};

/**
 * Checks if a delivery record exists in the deliveries table.
 * @param {string} deliveryId - The UUID of the delivery to check
 * @returns {Promise<boolean>} - True if it exists
 */
export const checkDeliveryExists = async (deliveryId) => {
  if (!isValidUUID(deliveryId)) return false;
  
  try {
    const { data, error } = await supabase
      .from('deliveries')
      .select('id')
      .eq('id', deliveryId)
      .maybeSingle();
      
    if (error) {
      console.error('[DeliveryValidation] Error checking delivery existence:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('[DeliveryValidation] Exception during existence check:', error);
    return false;
  }
};

/**
 * Validates data payload for creating a delivery_tracking record.
 * @param {Object} data - The tracking data to validate
 * @returns {Object} - Result with isValid boolean and array of errors
 */
export const validateDeliveryTrackingData = (data) => {
  const errors = [];
  
  if (!data) {
    return { isValid: false, errors: ['Tracking data is null or undefined'] };
  }
  
  if (!data.delivery_id) {
    errors.push('delivery_id is required');
  } else if (!isValidUUID(data.delivery_id)) {
    errors.push('delivery_id must be a valid UUID');
  }
  
  if (!data.status) {
    errors.push('status is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};