import { useCallback, useRef, useState } from 'react';
import { VoiceService } from '@/lib/VoiceService';

/**
 * A safe hook for handling delivery voice notifications.
 * Never throws errors, degrades gracefully if voice is unsupported.
 */
export function useDeliveryVoiceNotification() {
  const [isSupported] = useState(() => {
    try {
      return VoiceService && typeof VoiceService.isAvailable === 'function' ? VoiceService.isAvailable() : false;
    } catch (e) {
      return false;
    }
  });
  
  const lastSpokenStatusRef = useRef(null);

  const getMessageForStatus = (status) => {
    switch (status) {
      case 'pending': return 'Votre commande de livraison est en attente.';
      case 'confirmed': return 'Votre commande est confirmée et en cours de préparation.';
      case 'preparing': return 'Votre commande est en cuisine.';
      case 'ready': return 'Votre commande est prête pour la livraison.';
      case 'in_transit': return 'Votre livreur est en route. Préparez-vous à le recevoir.';
      case 'arrived_at_customer': return 'Le livreur est arrivé à votre adresse.';
      case 'delivered': return 'Votre commande a été livrée. Bon appétit !';
      case 'cancelled': return 'Votre commande a été annulée.';
      default: return null;
    }
  };

  const playNotification = useCallback(async (status) => {
    try {
      // Prevent redundant announcements
      if (lastSpokenStatusRef.current === status) {
        return false;
      }

      if (!isSupported) {
        console.warn('useDeliveryVoiceNotification: Voice not supported');
        return false;
      }

      const message = getMessageForStatus(status);
      if (!message) {
        return false;
      }

      if (VoiceService && typeof VoiceService.speak === 'function') {
        const success = await VoiceService.speak(message);
        if (success) {
          lastSpokenStatusRef.current = status;
        }
        return success;
      }
      return false;

    } catch (error) {
      console.warn('useDeliveryVoiceNotification: Error playing notification', error);
      return false; // Safe default
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    try {
      if (isSupported && VoiceService && typeof VoiceService.stop === 'function') {
        VoiceService.stop();
      }
    } catch (error) {
      console.warn('useDeliveryVoiceNotification: Error stopping voice', error);
    }
  }, [isSupported]);

  return {
    playNotification,
    stop,
    isSupported
  };
}