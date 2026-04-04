export const deliveryVoiceMessages = {
  fr: {
    pending: "Votre commande a été reçue et est en attente de confirmation",
    confirmed: "Votre commande a été confirmée",
    preparing: "Votre commande est en préparation",
    ready: "Votre commande est prête",
    ready_for_pickup: "Votre commande est prête pour la livraison",
    in_transit: "Votre commande est en cours de livraison",
    delivered: "Votre commande a été livrée",
    cancelled: "Votre commande a été annulée",
    arrived_at_customer: "Le livreur est arrivé"
  },
  en: {
    pending: "Your order has been received and is awaiting confirmation",
    confirmed: "Your order has been confirmed",
    preparing: "Your order is being prepared",
    ready: "Your order is ready",
    ready_for_pickup: "Your order is ready for delivery",
    in_transit: "Your order is on its way",
    delivered: "Your order has been delivered",
    cancelled: "Your order has been cancelled",
    arrived_at_customer: "The driver has arrived"
  }
};

export const getDeliveryMessage = (status, language = 'fr') => {
  const messages = deliveryVoiceMessages[language] || deliveryVoiceMessages['fr'];
  return messages[status] || messages['pending']; // Default fallback
};