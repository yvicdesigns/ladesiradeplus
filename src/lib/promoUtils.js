import { supabase } from '@/lib/customSupabaseClient';
import { retryOperation } from '@/lib/networkErrorHandler';
import { fetchWithTimeout } from '@/lib/timeoutUtils';
import { applyIsDeletedFilter } from '@/lib/softDeleteUtils';
import { formatCurrency } from '@/lib/formatters';

/**
 * Formats a number as a price string using the global currency formatter.
 * @param {number} amount - The price amount to format
 * @returns {string} The formatted price string
 */
export const formatPrice = (amount) => formatCurrency(amount);

/**
 * Calculates the discounted price based on original price and discount details.
 * @param {number} originalPrice - The original price of the product
 * @param {string} discountType - The type of discount ('percentage' or 'fixed_amount')
 * @param {number} discountValue - The value of the discount
 * @returns {object} Object containing original price, final calculated price, and formatted final price
 */
export const calculateDiscountedPrice = (originalPrice, discountType, discountValue) => {
  const price = parseFloat(originalPrice) || 0;
  const value = parseFloat(discountValue) || 0;
  
  let discountedPrice = price;
  
  if (discountType === 'percentage') {
      discountedPrice = price * (1 - value / 100);
  } else if (discountType === 'fixed_amount') {
      discountedPrice = price - value;
  }
  
  discountedPrice = Math.max(0, discountedPrice);
  
  return {
      original: price,
      final: discountedPrice,
      formatted: formatCurrency(discountedPrice)
  };
};

/**
 * Ensures that the 'PROMO' category exists in the menu_categories table.
 */
export const ensurePromoCategory = async () => {
  const operation = async () => {
    let query = supabase.from('menu_categories').select('id').eq('name', 'PROMO');
    query = applyIsDeletedFilter(query, false, 'menu_categories');
    
    const { data: existingCategory, error: fetchError } = await fetchWithTimeout(query.maybeSingle());

    if (fetchError) throw fetchError;

    if (!existingCategory) {
      const { data: newCategory, error: createError } = await fetchWithTimeout(
        supabase
          .from('menu_categories')
          .insert([{ name: 'PROMO', description: 'Offres spéciales et promotions', display_order: 0 }])
          .select()
          .single()
      );

      if (createError) throw createError;
      return newCategory;
    }

    return existingCategory;
  };

  try {
    return await retryOperation(operation);
  } catch (err) {
    console.error('Failed to ensure PROMO category after retries:', err);
    return null;
  }
};

/**
 * Ensures that a default banner exists in the banners table.
 */
export const ensureDefaultBanner = async () => {
  const operation = async () => {
    let query = supabase.from('banners').select('id').eq('is_active', true);
    query = applyIsDeletedFilter(query, false, 'banners');
    
    const { data: existingBanners, error: fetchError } = await fetchWithTimeout(query.limit(1));

    if (fetchError) throw fetchError;

    if (!existingBanners || existingBanners.length === 0) {
      const { data: newBanner, error: createError } = await fetchWithTimeout(
        supabase
          .from('banners')
          .insert([{
            title: 'Bienvenue chez nous',
            image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80',
            is_active: true,
            display_order: 1,
            link_url: '/menu'
          }])
          .select()
          .single()
      );

      if (createError) throw createError;
      return newBanner;
    }

    return existingBanners[0];
  };

  try {
    return await retryOperation(operation);
  } catch (err) {
    console.error('Failed to ensure default banner after retries:', err);
    return null;
  }
};