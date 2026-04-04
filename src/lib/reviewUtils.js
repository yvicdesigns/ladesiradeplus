import { getValidatedRestaurantId } from '@/lib/restaurantValidation';

/**
 * Validates and ensures a valid restaurant_id is returned for review operations.
 * Throws a clear error if the restaurant_id is missing or invalid.
 * 
 * @param {string} currentRestaurantId - The restaurant ID from context or state
 * @returns {string} A valid UUID restaurant_id
 */
export const getValidatedReviewRestaurantId = (currentRestaurantId) => {
  try {
    const id = getValidatedRestaurantId(currentRestaurantId);
    if (!id) {
      throw new Error("Restaurant ID is missing.");
    }
    return id;
  } catch (error) {
    console.error("[ReviewUtils] Validation error: Missing or invalid restaurant_id.", error);
    throw new Error("Erreur: Restaurant non configuré. Impossible d'enregistrer ou de modifier l'avis. Veuillez contacter l'administrateur.");
  }
};