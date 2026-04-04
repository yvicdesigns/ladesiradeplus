// Module completely removed per instructions.
export const usePromotions = () => {
    return {
        promotions: [], promoCodes: [], specialOffers: [], promotionRules: [], promotionUsage: [],
        loadingPromotions: false, loadingPromoCodes: false, loadingSpecialOffers: false, loadingRules: false, loadingUsage: false,
        createPromotion: async () => false, updatePromotion: async () => false, deletePromotion: async () => false, togglePromotionStatus: async () => false, duplicatePromotion: async () => false,
        createPromoCode: async () => false, updatePromoCode: async () => false, deletePromoCode: async () => false, togglePromoCodeStatus: async () => false, resetPromoCodeCounter: async () => false,
        createSpecialOffer: async () => false, updateSpecialOffer: async () => false, deleteSpecialOffer: async () => false, toggleSpecialOfferStatus: async () => false, duplicateSpecialOffer: async () => false,
        createPromotionRule: async () => false, updatePromotionRule: async () => false, deletePromotionRule: async () => false
    };
};