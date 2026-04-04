import { supabase } from './customSupabaseClient';

/**
 * Synchronizes a banner's discount with its linked product.
 * @param {Object} bannerData - The new banner data being saved
 * @param {Object} oldBannerData - The previous state of the banner (for detecting changes)
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export const syncBannerWithProduct = async (bannerData, oldBannerData = null) => {
  try {
    const { linked_product_id, discount_percentage } = bannerData;
    const oldProductId = oldBannerData?.linked_product_id;

    // 1. If product link changed, remove promo from old product
    // We check if there was an old product, and if it's different from the new one
    // OR if the new one is 'none' (unlinking)
    if (oldProductId && oldProductId !== 'none' && oldProductId !== linked_product_id) {
      console.log(`Removing promo from old product: ${oldProductId}`);
      const { error: cleanError } = await supabase
        .from('menu_items')
        .update({ is_promo: false })
        .eq('id', oldProductId);
      
      if (cleanError) throw cleanError;
    }

    // 2. If we have a valid linked product, sync it
    if (linked_product_id && linked_product_id !== 'none') {
      console.log(`Syncing promo to product: ${linked_product_id} with discount ${discount_percentage}%`);
      const { error: syncError } = await supabase
        .from('menu_items')
        .update({ 
          is_promo: true,
          promo_discount: discount_percentage || 0
        })
        .eq('id', linked_product_id);

      if (syncError) throw syncError;
    }

    return { success: true };
  } catch (error) {
    console.error('Sync failed:', error);
    return { success: false, error };
  }
};

/**
 * Removes promo status from a product when its banner is deleted
 * @param {string} productId - The ID of the product to update
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export const removePromoFromProduct = async (productId) => {
  if (!productId || productId === 'none') return { success: true };

  try {
    console.log(`Removing promo due to banner deletion: ${productId}`);
    const { error } = await supabase
      .from('menu_items')
      .update({ is_promo: false })
      .eq('id', productId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Remove promo failed:', error);
    return { success: false, error };
  }
};