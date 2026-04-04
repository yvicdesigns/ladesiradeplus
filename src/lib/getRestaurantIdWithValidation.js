import { validateRestaurantExists } from './validateRestaurantExists';

/**
 * Safely retrieves and validates a restaurant_id.
 * Throws an error if the ID is missing or invalid.
 * 
 * @param {string} restaurantId - The raw restaurant ID from state/context.
 * @returns {Promise<string>} The validated restaurant ID.
 * @throws {Error} If missing or invalid.
 */
export const getRestaurantIdWithValidation = async (restaurantId) => {
  if (!restaurantId) {
    throw new Error("ID du restaurant manquant.");
  }

  const { exists, error } = await validateRestaurantExists(restaurantId);
  
  if (!exists) {
    throw new Error(error || "Le restaurant n'existe pas. Impossible de continuer.");
  }

  return restaurantId;
};