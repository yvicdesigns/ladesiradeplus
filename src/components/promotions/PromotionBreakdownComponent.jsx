import React from 'react';
import { Tag, Sparkles, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export const PromotionBreakdownComponent = ({ calculation }) => {
  if (!calculation) return null;

  const {
    originalSubtotal,
    productDiscountTotal,
    subtotalAfterProductDiscounts,
    promoCodeDiscountTotal,
    promoCodeName,
    finalTotal,
    deliveryFee,
    promoCodeError
  } = calculation;

  const hasProductDiscounts = productDiscountTotal > 0;
  const hasPromoCode = promoCodeDiscountTotal > 0;

  if (!hasProductDiscounts && !hasPromoCode && !promoCodeError) return null;

  return (
    <div className="bg-amber-50/50 rounded-xl p-4 space-y-3 border border-green-100 text-sm">
      <h4 className="font-bold text-gray-800 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-500" />
        Détails des économies
      </h4>

      {/* Product Level Discounts */}
      {hasProductDiscounts && (
        <div className="space-y-1">
           <div className="flex justify-between text-gray-500 text-xs">
             <span>Sous-total initial</span>
             <span className="line-through">{formatCurrency(originalSubtotal)}</span>
           </div>
           <div className="flex justify-between text-amber-600 font-medium">
             <span>Promotions produits</span>
             <span>-{formatCurrency(productDiscountTotal)}</span>
           </div>
           <div className="border-t border-dashed border-amber-200 my-1"></div>
        </div>
      )}

      {/* Promo Code */}
      {hasPromoCode && (
        <div className="flex justify-between text-amber-700 font-bold bg-amber-50 p-2 rounded-lg border border-green-100">
          <span className="flex items-center gap-1">
             <Tag className="w-3 h-3" /> Code: {promoCodeName}
          </span>
          <span>-{formatCurrency(promoCodeDiscountTotal)}</span>
        </div>
      )}

      {/* Promo Code Error */}
      {promoCodeError && (
        <div className="flex items-start gap-2 text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 text-xs">
           <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
           <span>{promoCodeError}</span>
        </div>
      )}

      {/* Summary Logic for complex breakdowns */}
      {(hasProductDiscounts || hasPromoCode) && (
        <div className="pt-2 border-t border-amber-200 flex justify-between items-center">
            <span className="text-gray-600 font-medium">Total économisé</span>
            <span className="text-amber-600 font-bold text-lg">
                {formatCurrency(productDiscountTotal + promoCodeDiscountTotal)}
            </span>
        </div>
      )}
    </div>
  );
};