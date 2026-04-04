import { useCallback, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { VoiceService } from '@/lib/VoiceService';

export const useVoicePreferences = () => {
  const [enabled, setEnabled] = useLocalStorage('voice_notifications_enabled', true);
  const [language, setLanguage] = useLocalStorage('voice_notifications_language', 'fr');
  const [volume, setVolume] = useLocalStorage('voice_notifications_volume', 1.0);
  
  // Safe check for support
  const [isSupported] = useState(() => {
    try {
      if (typeof VoiceService !== 'undefined' && typeof VoiceService.isSupported === 'function') {
        return VoiceService.isSupported();
      }
      return false;
    } catch (err) {
      console.warn("useVoicePreferences: Error checking support", err);
      return false;
    }
  });

  const playTestMessage = useCallback(async () => {
    if (!isSupported) {
      console.warn("useVoicePreferences: Cannot play test message, voice not supported");
      return false;
    }
    
    try {
      if (VoiceService && typeof VoiceService.speak === 'function') {
        const text = language === 'fr' 
          ? "Ceci est un test de notification vocale. L'audio fonctionne correctement." 
          : "This is a voice notification test. Audio is working correctly.";
          
        console.log("useVoicePreferences: Triggering test message", { text, volume, language });
        
        const success = await VoiceService.speak(text, {
          volume: volume,
          rate: 1.0,
          pitch: 1.0,
          lang: language === 'fr' ? 'fr-FR' : 'en-US'
        });
        
        return success;
      }
      return false;
    } catch (error) {
      console.error("useVoicePreferences: Voice test failed:", error);
      return false;
    }
  }, [language, volume, isSupported]);

  return {
    enabled,
    setEnabled,
    language,
    setLanguage,
    volume,
    setVolume,
    playTestMessage,
    isSupported
  };
};