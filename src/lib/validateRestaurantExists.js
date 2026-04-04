import { validateRestaurantIdBeforeOrderCreation } from './restaurantValidation';

/**
 * Validates if a given restaurant_id exists in the restaurants table.
 * @param {string} restaurantId - The UUID of the restaurant to validate.
 * @returns {Promise<{exists: boolean, error?: string}>}
 */
export const validateRestaurantExists = async (restaurantId) => {
  const result = await validateRestaurantIdBeforeOrderCreation(restaurantId);
  return { 
    exists: result.valid, 
    error: result.error 
  };
};