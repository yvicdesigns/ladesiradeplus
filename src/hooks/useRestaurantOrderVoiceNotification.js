import { useCallback, useRef, useState } from 'react';
import { VoiceService } from '@/lib/VoiceService';

/**
 * A safe hook for handling restaurant order voice notifications.
 * Never throws errors, degrades gracefully if voice is unsupported.
 */
export function useRestaurantOrderVoiceNotification() {
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
      case 'pending': return 'Votre commande a été envoyée en cuisine.';
      case 'preparing': return 'Vos plats sont en cours de préparation.';
      case 'ready': return 'Votre commande est prête !';
      case 'served': return 'Votre commande a été servie. Bon appétit !';
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
        console.warn('useRestaurantOrderVoiceNotification: Voice not supported');
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
      console.warn('useRestaurantOrderVoiceNotification: Error playing notification', error);
      return false; // Safe default
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    try {
      if (isSupported && VoiceService && typeof VoiceService.stop === 'function') {
        VoiceService.stop();
      }
    } catch (error) {
      console.warn('useRestaurantOrderVoiceNotification: Error stopping voice', error);
    }
  }, [isSupported]);

  return {
    playNotification,
    stop,
    isSupported
  };
}