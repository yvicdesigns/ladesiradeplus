import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import SoundCacheService from '@/lib/SoundCacheService';
import { SoundSettingsService } from '@/lib/SoundSettingsService';

const SoundContext = createContext(null);

export const SoundProvider = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useLocalStorage('soundEnabled', true);
  const [soundVolume, setSoundVolume] = useLocalStorage('soundVolume', 0.5);
  const hasInitialized = useRef(false);

  useEffect(() => {
    const initSoundSettings = async () => {
      if (!soundEnabled) return;
      try {
        const settings = await SoundSettingsService.getAdminSoundSettings();
        SoundCacheService.updateSettings({
          global: settings.default_sound_volume || soundVolume,
          button: settings.button_volume,
          notification: settings.notification_volume,
          success: settings.success_volume,
          buttonType: settings.button_sound_type,
          notificationType: settings.notification_sound_type,
          successType: settings.success_sound_type
        });
        hasInitialized.current = true;
      } catch (err) {
        console.error("useSound: Failed to initialize settings", err);
      }
    };
    initSoundSettings();
  }, [soundEnabled, soundVolume]);

  const playSound = useCallback((category = 'button', volumeOverride = null) => {
    if (!soundEnabled) return;
    switch (category) {
      case 'button':
      case 'click':
        SoundCacheService.playButtonSound(volumeOverride);
        break;
      case 'notification':
        SoundCacheService.playNotificationSound(volumeOverride);
        break;
      case 'success':
        SoundCacheService.playSuccessSound(volumeOverride);
        break;
      default:
        SoundCacheService.playGeneratedSound(category, volumeOverride || 0.5);
    }
  }, [soundEnabled]);

  const testBeep = async () => {
    if (!soundEnabled) return false;
    try {
        await SoundCacheService.playGeneratedSound('beep', 0.5);
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
  };

  const toggleSound = () => setSoundEnabled(!soundEnabled);

  const value = {
    playSound,
    toggleSound,
    soundEnabled,
    testBeep,
    soundVolume,
    setSoundVolume
  };

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};