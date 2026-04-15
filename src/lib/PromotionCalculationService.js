/**
 * PromotionCalculationService
 * Handles item-level and promo code calculations.
 */
export const PromotionCalculationService = {
  calculateItemStats: (item) => {
    const originalPrice = parseFloat(item.price);
    const quantity = parseInt(item.quantity || 1);

    const hasPromo = item.is_promo && item.promo_discount > 0;
    const discountPercent = hasPromo ? parseFloat(item.promo_discount) : 0;

    const discountAmountPerUnit = hasPromo
      ? (originalPrice * (discountPercent / 100))
      : 0;

    const finalPricePerUnit = originalPrice - discountAmountPerUnit;

    return {
      itemId: item.id,
      name: item.name,
      quantity,
      originalPricePerUnit: originalPrice,
      originalTotal: originalPrice * quantity,
      hasPromo,
      discountPercent,
      discountAmountPerUnit,
      totalDiscountAmount: discountAmountPerUnit * quantity,
      finalPricePerUnit,
      finalTotal: finalPricePerUnit * quantity
    };
  },

  /**
   * Validates a promo code against the current subtotal.
   * Returns { isValid: boolean, error?: string }
   */
  validatePromoCode: (promoCode, subtotal) => {
    if (!promoCode) return { isValid: false, error: "Code invalide." };

    if (promoCode.is_deleted) return { isValid: false, error: "Ce code promotionnel n'existe plus." };

    if (promoCode.status && promoCode.status !== 'active') {
      return { isValid: false, error: "Ce code promotionnel n'est plus actif." };
    }

    const now = new Date();
    if (promoCode.start_date && new Date(promoCode.start_date) > now) {
      return { isValid: false, error: "Ce code promotionnel n'est pas encore valide." };
    }
    if (promoCode.expiry_date && new Date(promoCode.expiry_date) < now) {
      return { isValid: false, error: "Ce code promotionnel a expiré." };
    }

    if (promoCode.max_uses !== null && promoCode.max_uses !== undefined &&
        promoCode.usage_count >= promoCode.max_uses) {
      return { isValid: false, error: "Ce code promotionnel a atteint sa limite d'utilisation." };
    }

    if (promoCode.min_order_amount && subtotal < promoCode.min_order_amount) {
      return {
        isValid: false,
        error: `Montant minimum requis : ${promoCode.min_order_amount} XAF.`
      };
    }

    return { isValid: true };
  },

  /**
   * Calculates the discount amount for a given promo code and subtotal.
   */
  applyPromoCodeDiscount: (promoCode, subtotal) => {
    if (!promoCode) return 0;

    let discount = 0;
    if (promoCode.discount_type === 'percentage') {
      discount = subtotal * (parseFloat(promoCode.discount_value) / 100);
    } else if (promoCode.discount_type === 'fixed') {
      discount = parseFloat(promoCode.discount_value) || 0;
    }

    // Cap by max_discount_amount if set
    if (promoCode.max_discount_amount && discount > promoCode.max_discount_amount) {
      discount = promoCode.max_discount_amount;
    }

    // Discount cannot exceed subtotal
    return Math.min(discount, subtotal);
  },

  calculateOrderTotals: (cartItems, promoCode = null, deliveryFee = 0, orderType = 'delivery') => {
    let subtotalOriginal = 0;
    let subtotalAfterProductDiscounts = 0;
    let productDiscountTotal = 0;

    const itemBreakdowns = cartItems.map(item => {
      const stats = PromotionCalculationService.calculateItemStats(item);
      subtotalOriginal += stats.originalTotal;
      subtotalAfterProductDiscounts += stats.finalTotal;
      productDiscountTotal += stats.totalDiscountAmount;
      return stats;
    });

    // Apply promo code discount on top of product discounts
    const promoCodeDiscountTotal = promoCode
      ? PromotionCalculationService.applyPromoCodeDiscount(promoCode, subtotalAfterProductDiscounts)
      : 0;

    const subtotalAfterAllDiscounts = subtotalAfterProductDiscounts - promoCodeDiscountTotal;

    // Only apply delivery fees for delivery orders
    const effectiveDeliveryFee = orderType === 'delivery' ? (parseFloat(deliveryFee) || 0) : 0;
    const finalTotal = subtotalAfterAllDiscounts + effectiveDeliveryFee;

    return {
      items: itemBreakdowns,
      originalSubtotal: subtotalOriginal,
      subtotalAfterProductDiscounts,
      productDiscountTotal,
      promoCodeDiscountTotal,
      totalSavings: productDiscountTotal + promoCodeDiscountTotal,
      promoCodeApplied: promoCodeDiscountTotal > 0,
      promoCodeName: promoCode?.code || null,
      promoCodeError: null,
      deliveryFee: effectiveDeliveryFee,
      finalTotal,
      breakdown: {
        timestamp: new Date().toISOString(),
        product_discounts: itemBreakdowns.filter(i => i.hasPromo).map(i => ({
          name: i.name,
          savings: i.totalDiscountAmount
        })),
        promo_code: promoCode ? {
          code: promoCode.code,
          discount_type: promoCode.discount_type,
          discount_value: promoCode.discount_value,
          savings: promoCodeDiscountTotal
        } : null
      }
    };
  }
};