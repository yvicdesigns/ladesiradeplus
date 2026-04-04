/**
 * Simplified PromotionCalculationService
 * Only handles base calculations without external promotion rules as module was removed.
 */
export const PromotionCalculationService = {
  calculateItemStats: (item) => {
    const originalPrice = parseFloat(item.price);
    const quantity = parseInt(item.quantity || 1);
    
    // Product-specific discounts (if any remain) are still calculated visually for the item
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

    const finalSubtotal = subtotalAfterProductDiscounts;
    
    // CRITICAL FIX: Only apply delivery fees if the order type is actually delivery.
    // If order is sur place (restaurant/counter), delivery fee MUST be zero.
    const effectiveDeliveryFee = orderType === 'delivery' ? (parseFloat(deliveryFee) || 0) : 0;
    const finalTotal = finalSubtotal + effectiveDeliveryFee;

    return {
      items: itemBreakdowns,
      originalSubtotal: subtotalOriginal,
      subtotalAfterProductDiscounts,
      productDiscountTotal,
      promoCodeDiscountTotal: 0,
      totalSavings: productDiscountTotal,
      promoCodeApplied: false,
      promoCodeName: null,
      promoCodeError: null,
      deliveryFee: effectiveDeliveryFee,
      finalTotal,
      breakdown: {
        timestamp: new Date().toISOString(),
        product_discounts: itemBreakdowns.filter(i => i.hasPromo).map(i => ({
          name: i.name,
          savings: i.totalDiscountAmount
        }))
      }
    };
  }
};