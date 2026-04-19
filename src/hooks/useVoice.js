import { useState, useEffect, useCallback } from 'react';
import { VoiceService } from '@/lib/VoiceService';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SoundSettingsService } from '@/lib/SoundSettingsService';

export const useVoice = (role = 'client') => {
  // Local preferences for the device/browser
  const [localVolume, setLocalVolume] = useLocalStorage('voice_volume', 1.0);
  const [localRate, setLocalRate] = useLocalStorage('voice_rate', 1.0);
  const [localPitch, setLocalPitch] = useLocalStorage('voice_pitch', 1.0);
  const [localEnabled, setLocalEnabled] = useLocalStorage('voice_enabled', true);

  // Global settings from database
  const [globalSettings, setGlobalSettings] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [initError, setInitError] = useState(null);
  
  // Safely check if VoiceService exists and is supported.
  // Called once during initialization. VoiceService now caches this internally.
  const [isSupported] = useState(() => {
    try {
      // On native Capacitor (Android/iOS), TTS is always available via native plugin
      if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
        return true;
      }
      if (typeof VoiceService !== 'undefined' && typeof VoiceService.isSupported === 'function') {
        return VoiceService.isSupported();
      }
      return false;
    } catch (err) {
      console.error("useVoice: Failed to initialize VoiceService check", err);
      return false;
    }
  });

  useEffect(() => {
    // Load global settings safely once on mount
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const settings = await SoundSettingsService.getAdminSoundSettings();
        if (isMounted) setGlobalSettings(settings);
      } catch (err) {
        console.error("useVoice: Failed to load global settings", err);
        if (isMounted) setInitError(err);
      }
    };
    loadSettings();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Cleanup pending speech on unmount to prevent memory leaks/hanging voices
  useEffect(() => {
    return () => {
      try {
        if (VoiceService && typeof VoiceService.stop === 'function') {
          VoiceService.stop();
        }
      } catch (err) {
        console.error("useVoice: Error cleaning up voice on unmount", err);
      }
    };
  }, []);

  const speak = useCallback((text) => {
    if (!isSupported) {
      console.warn("useVoice: Speech not supported, ignoring speak request");
      return;
    }
    if (!localEnabled) return;

    // Check global enablement based on role
    if (globalSettings) {
      if (role === 'admin' && !globalSettings.admin_voice_enabled) return;
      if (role === 'client' && globalSettings.client_voice_enabled === false) return; // explicit check for false if exists
    }

    try {
      if (VoiceService && typeof VoiceService.speak === 'function') {
        VoiceService.speak(text, {
          volume: localVolume,
          rate: localRate,
          pitch: localPitch,
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false)
        });
      }
    } catch (e) {
      console.error("useVoice: Error calling speak", e);
      setIsSpeaking(false);
    }
  }, [isSupported, localEnabled, localVolume, localRate, localPitch, globalSettings, role]);

  /**
   * Dedicated testing method with strict timeout and state management.
   * Ensures the UI never gets stuck in an infinite loading state.
   */
  const testVoice = useCallback(async (text, lang = 'fr') => {
    if (!isSupported) {
      console.warn("[useVoice] testVoice aborted: VoiceService not supported.");
      return false;
    }
    
    return new Promise((resolve) => {
      let isResolved = false;
      
      const finish = (result) => {
        if (!isResolved) {
          isResolved = true;
          setIsSpeaking(false);
          resolve(result);
        }
      };

      // Strict 15500ms timeout for testing to prevent permanent loading states, 
      // adding buffer to VoiceService's internal 15000ms timeout.
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          console.warn("[useVoice] Outer testVoice promise timed out after 15500ms");
          try { VoiceService.stop(); } catch (e) {}
          finish(false);
        }
      }, 15500);

      try {
        VoiceService.speak(text, {
          volume: localVolume,
          rate: localRate,
          pitch: localPitch,
          lang: lang,
          timeout: 15000, // Increased to 15s to allow slower devices (especially mobile) to load voices
          onStart: () => {
            setIsSpeaking(true);
          },
          onEnd: () => {
            clearTimeout(timeoutId);
            finish(true);
          },
          onError: (err) => {
            console.error("[useVoice] VoiceService inner error during testVoice", err);
            clearTimeout(timeoutId);
            finish(false);
          }
        });
      } catch (err) {
        console.error("[useVoice] Exception caught during VoiceService.speak in testVoice", err);
        clearTimeout(timeoutId);
        finish(false);
      }
    });
  }, [isSupported, localVolume, localRate, localPitch]);

  // Specific high-level methods exposed via hook with safe fallbacks
  const speakNewOrder = useCallback(() => {
    if(!localEnabled || !isSupported) return;
    try { VoiceService?.speakNewOrder?.(globalSettings); } catch(e) { console.warn(e); }
  }, [localEnabled, globalSettings, isSupported]);

  const speakOrderPending = useCallback(() => {
    if(!localEnabled || !isSupported) return;
    try { VoiceService?.speakOrderPending?.(globalSettings); } catch(e) { console.warn(e); }
  }, [localEnabled, globalSettings, isSupported]);

  const speakOrderReceived = useCallback(() => {
    if(!localEnabled || !isSupported) return;
    try { VoiceService?.speakOrderReceived?.(globalSettings); } catch(e) { console.warn(e); }
  }, [localEnabled, globalSettings, isSupported]);

  const speakOrderPreparing = useCallback(() => {
    if(!localEnabled || !isSupported) return;
    try { VoiceService?.speakOrderPreparing?.(globalSettings); } catch(e) { console.warn(e); }
  }, [localEnabled, globalSettings, isSupported]);

  const speakOrderReady = useCallback(() => {
    if(!localEnabled || !isSupported) return;
    try { VoiceService?.speakOrderReady?.(globalSettings); } catch(e) { console.warn(e); }
  }, [localEnabled, globalSettings, isSupported]);

  const speakOrderSent = useCallback(() => {
    if(!localEnabled || !isSupported) return;
    try { VoiceService?.speakOrderSent?.(globalSettings); } catch(e) { console.warn(e); }
  }, [localEnabled, globalSettings, isSupported]);

  const speakOrderDelivered = useCallback(() => {
    if(!localEnabled || !isSupported) return;
    try { VoiceService?.speakOrderDelivered?.(globalSettings); } catch(e) { console.warn(e); }
  }, [localEnabled, globalSettings, isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    try {
      VoiceService?.stop?.();
      setIsSpeaking(false);
    } catch (e) {
      console.error("useVoice: Error calling stop", e);
    }
  }, [isSupported]);

  return {
    speak,
    testVoice, 
    stop,
    isSpeaking,
    isSupported,
    initError,
    
    // Expose settings for UI binding and text access
    volume: localVolume,
    setVolume: setLocalVolume,
    rate: localRate,
    setRate: setLocalRate,
    pitch: localPitch,
    setPitch: setLocalPitch,
    enabled: localEnabled,
    setEnabled: setLocalEnabled,
    settings: globalSettings,
    
    // High-level methods
    speakNewOrder,
    speakOrderPending,
    speakOrderReceived,
    speakOrderPreparing,
    speakOrderReady,
    speakOrderSent,
    speakOrderDelivered
  };
};