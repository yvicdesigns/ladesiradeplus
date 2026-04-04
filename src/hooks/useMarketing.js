// Module completely removed per instructions.
export const useMarketing = () => {
    return {
        campaigns: [], promotions: [], promoCodes: [], subscribers: [], templates: [],
        loadingCampaigns: false, loadingPromotions: false, loadingPromoCodes: false, loadingSubscribers: false, loadingTemplates: false,
        createRecord: async () => false, updateRecord: async () => false, deleteRecord: async () => false,
        sendCampaign: async () => false, generatePromoCodes: async () => false
    };
};