import { RESTAURANT_ID } from '@/lib/adminSettingsUtils';
import { supabase } from '@/lib/customSupabaseClient';
import { logger } from '@/lib/logger';

export const VALID_RESTAURANT_ID = RESTAURANT_ID;

/**
 * Returns a guaranteed valid restaurant ID format.
 * If the provided ID is invalid or missing, it falls back to the master ID.
 */
export const getRestaurantIdWithFallback = (id) => {
  // Basic UUID v4 regex check
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (id && uuidRegex.test(id)) {
    return id;
  }
  logger.warn(`[RestaurantValidation] Invalid or missing restaurant ID: ${id}. Falling back to default.`);
  return VALID_RESTAURANT_ID;
};

/**
 * Validates that a restaurant ID exists in the database before allowing operations.
 */
export const validateRestaurantIdBeforeOrderCreation = async (restaurantId) => {
  const targetId = getRestaurantIdWithFallback(restaurantId);
  
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id')
      .eq('id', targetId)
      .maybeSingle();

    if (error) {
      logger.error('[RestaurantValidation] Database error during validation:', error);
      return { valid: false, error: "Erreur de base de données lors de la vérification du restaurant." };
    }

    if (!data) {
      logger.error(`[RestaurantValidation] Restaurant ID ${targetId} does not exist in the database.`);
      return { valid: false, error: "Erreur: Le restaurant n'existe pas. Veuillez contacter le support." };
    }

    return { valid: true, restaurantId: targetId };
  } catch (err) {
    logger.error('[RestaurantValidation] Unexpected error:', err);
    return { valid: false, error: "Erreur inattendue lors de la vérification du restaurant." };
  }
};

/**
 * Safe wrapper to ensure a valid restaurant_id is always returned for CRUD operations
 */
export const getValidatedRestaurantId = (currentId) => {
  const id = getRestaurantIdWithFallback(currentId);
  if (!id) {
    console.error("[RestaurantValidation] Critical: No valid restaurant_id could be resolved.");
    throw new Error("Erreur: Restaurant non configuré. Veuillez contacter l'administrateur.");
  }
  return id;
};