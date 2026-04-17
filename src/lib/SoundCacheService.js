import { SoundGeneratorService } from './SoundGeneratorService';

const SoundCacheService = {
  audioContext: null,
  buffers: {}, // Cache for generated AudioBuffers: { 'beep': AudioBuffer, ... }
  initialized: false,
  
  // Settings cache
  settings: {
    volumes: {
      global: 0.9,
      button: 0.5,
      notification: 0.9,
      success: 0.6
    },
    types: {
      button: 'beep',
      notification: 'alert_bell',
      success: 'chime'
    }
  },

  updateSettings: (newSettings) => {
    SoundCacheService.settings = {
      volumes: {
        global: newSettings.global ?? SoundCacheService.settings.volumes.global,
        button: newSettings.button ?? SoundCacheService.settings.volumes.button,
        notification: newSettings.notification ?? SoundCacheService.settings.volumes.notification,
        success: newSettings.success ?? SoundCacheService.settings.volumes.success
      },
      types: {
        button: newSettings.buttonType ?? SoundCacheService.settings.types.button,
        notification: newSettings.notificationType ?? SoundCacheService.settings.types.notification,
        success: newSettings.successType ?? SoundCacheService.settings.types.success
      }
    };
  },

  // Initialize the audio context and pre-load common sounds
  initializeSounds: async () => {
    if (SoundCacheService.initialized && SoundCacheService.audioContext) return;
    
    const success = SoundCacheService.initAudioContext();
    if (!success) {
        console.warn("AudioContext not supported in this browser");
        return;
    }

    // Pre-generate common sounds to warm up the cache
    const commonSounds = ['beep', 'ding', 'chime', 'pop', 'alert_bell'];
    const ctx = SoundCacheService.audioContext;
    
    try {
        const promises = commonSounds.map(async (sound) => {
            if (!SoundCacheService.buffers[sound]) {
                try {
                    const buffer = await SoundGeneratorService.generate(ctx, sound);
                    SoundCacheService.buffers[sound] = buffer;
                } catch (err) {
                    console.warn(`Failed to pre-generate sound: ${sound}`, err);
                }
            }
        });
        await Promise.all(promises);
    } catch (e) {
        console.warn("Error during sound initialization:", e);
    }
    
    SoundCacheService.initialized = true;
  },

  initAudioContext: () => {
    if (SoundCacheService.audioContext) return true;
    
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;

    SoundCacheService.audioContext = new AudioContext();
    return true;
  },

  // Generic method to play any sound type with specific volume
  playGeneratedSound: async (soundType, volume) => {
    if (!SoundCacheService.initAudioContext()) return;

    const ctx = SoundCacheService.audioContext;
    
    // Resume context if needed (browsers suspend it until user interaction)
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.error("Failed to resume audio context", e);
        return;
      }
    }

    // Check cache or generate
    if (!SoundCacheService.buffers[soundType]) {
      try {
        const buffer = await SoundGeneratorService.generate(ctx, soundType);
        SoundCacheService.buffers[soundType] = buffer;
      } catch (err) {
        console.error(`Failed to generate sound ${soundType}`, err);
        return;
      }
    }

    const buffer = SoundCacheService.buffers[soundType];
    if (!buffer) return;

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gainNode = ctx.createGain();
      
      // Calculate final volume: specific volume * global volume setting
      const globalVol = SoundCacheService.settings.volumes.global ?? 0.5;
      const specificVol = volume ?? 1.0;
      const finalVolume = Math.max(0, Math.min(1, specificVol * globalVol));
      
      gainNode.gain.setValueAtTime(finalVolume, ctx.currentTime);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);
    } catch (e) {
      console.error("Error playing sound", e);
    }
  },

  // Category specific methods using stored settings
  playButtonSound: (volumeOverride = null) => {
    const type = SoundCacheService.settings.types.button || 'beep';
    const volume = volumeOverride ?? SoundCacheService.settings.volumes.button ?? 0.5;
    SoundCacheService.playGeneratedSound(type, volume);
  },

  playNotificationSound: (volumeOverride = null) => {
    const type = SoundCacheService.settings.types.notification || 'ding';
    const volume = volumeOverride ?? SoundCacheService.settings.volumes.notification ?? 0.5;
    SoundCacheService.playGeneratedSound(type, volume);
  },

  playSuccessSound: (volumeOverride = null) => {
    const type = SoundCacheService.settings.types.success || 'chime';
    const volume = volumeOverride ?? SoundCacheService.settings.volumes.success ?? 0.5;
    SoundCacheService.playGeneratedSound(type, volume);
  }
};

export default SoundCacheService;