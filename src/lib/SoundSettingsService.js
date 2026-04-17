import { supabase } from '@/lib/customSupabaseClient';

// Simple in-memory cache to prevent redundant fetches
let settingsCache = null;
let lastFetchTime = 0;
const CACHE_TTL = 60000; // 1 minute cache

export const SoundSettingsService = {
  getAdminSoundSettings: async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && settingsCache && (now - lastFetchTime < CACHE_TTL)) {
      console.log('SoundSettingsService: Returning cached settings');
      return settingsCache;
    }

    console.log('SoundSettingsService: Fetching fresh settings from DB...');
    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
      try {
        const { data, error } = await supabase
          .from('sound_settings')
          .select('*')
          .maybeSingle(); 
        
        if (error) throw error;
        
        const settings = data || SoundSettingsService.getDefaultSettings();
        
        // Ensure defaults for new fields if they are missing in DB return
        const mergedSettings = {
          ...SoundSettingsService.getDefaultSettings(),
          ...settings
        };
        
        // Update cache
        settingsCache = mergedSettings;
        lastFetchTime = Date.now();
        
        console.log('SoundSettingsService: Settings retrieved successfully', { 
            admin_voice: mergedSettings.admin_voice_enabled,
            custom_audio: mergedSettings.admin_new_order_audio_enabled,
            volume: mergedSettings.notification_volume
        });
        
        return mergedSettings;

      } catch (error) {
        console.error(`SoundSettingsService: Error fetching settings (Attempt ${4 - retries}/3):`, error.message);
        retries--;
        
        if (retries === 0) {
          console.warn('SoundSettingsService: All fetch attempts failed. Returning cached or default settings.');
          return settingsCache || SoundSettingsService.getDefaultSettings();
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  },

  saveAdminSoundSettings: async (settings) => {
    if (!settings) throw new Error('No settings provided to save');

    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
      try {
        // First check if a record exists to decide on ID
        const { data: existing, error: fetchError } = await supabase
          .from('sound_settings')
          .select('id')
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }
        
        const payload = {
           default_sound_type: settings.default_sound_type,
           default_sound_volume: settings.default_sound_volume,
           button_volume: settings.button_volume ?? 0.5,
           notification_volume: settings.notification_volume ?? 0.5,
           success_volume: settings.success_volume ?? 0.5,
           button_sound_type: settings.button_sound_type ?? 'beep',
           notification_sound_type: settings.notification_sound_type ?? 'ding',
           success_sound_type: settings.success_sound_type ?? 'chime',
           
           // Voice settings
           voice_gender: settings.voice_gender,
           voice_speed: settings.voice_speed,
           voice_pitch: settings.voice_pitch,
           admin_voice_enabled: settings.admin_voice_enabled,
           client_voice_enabled: settings.client_voice_enabled,

           // Custom Voice Texts
           admin_new_order_voice_text: settings.admin_new_order_voice_text,
           client_order_pending_voice_text: settings.client_order_pending_voice_text,
           client_order_received_voice_text: settings.client_order_received_voice_text,
           client_order_preparing_voice_text: settings.client_order_preparing_voice_text,
           client_order_ready_voice_text: settings.client_order_ready_voice_text,
           client_order_sent_voice_text: settings.client_order_sent_voice_text,
           client_order_delivered_voice_text: settings.client_order_delivered_voice_text,
           
           // Real Audio Settings
           admin_new_order_audio_url: settings.admin_new_order_audio_url,
           admin_new_order_audio_enabled: settings.admin_new_order_audio_enabled,
           client_order_pending_audio_url: settings.client_order_pending_audio_url,
           client_order_pending_audio_enabled: settings.client_order_pending_audio_enabled,
           client_order_received_audio_url: settings.client_order_received_audio_url,
           client_order_received_audio_enabled: settings.client_order_received_audio_enabled,
           client_order_preparing_audio_url: settings.client_order_preparing_audio_url,
           client_order_preparing_audio_enabled: settings.client_order_preparing_audio_enabled,
           client_order_ready_audio_url: settings.client_order_ready_audio_url,
           client_order_ready_audio_enabled: settings.client_order_ready_audio_enabled,
           client_order_sent_audio_url: settings.client_order_sent_audio_url,
           client_order_sent_audio_enabled: settings.client_order_sent_audio_enabled,
           client_order_delivered_audio_url: settings.client_order_delivered_audio_url,
           client_order_delivered_audio_enabled: settings.client_order_delivered_audio_enabled,

           order_number_message: settings.order_number_message,
           order_status_message: settings.order_status_message,
           total_price_message: settings.total_price_message,
           order_details_message: settings.order_details_message,
           
           updated_at: new Date().toISOString()
        };

        if (existing?.id) {
           payload.id = existing.id;
        }

        const { data, error } = await supabase
          .from('sound_settings')
          .upsert(payload)
          .select()
          .single();
          
        if (error) throw error;

        settingsCache = data;
        lastFetchTime = Date.now();

        return data;
      } catch (error) {
        console.error(`SoundSettingsService: Error saving settings (Attempt ${4 - retries}/3):`, error.message);
        retries--;
        
        if (retries === 0) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  },

  getDefaultSettings: () => ({
    default_sound_type: 'alert_bell',
    default_sound_volume: 0.9,
    button_volume: 0.5,
    notification_volume: 0.9,
    success_volume: 0.6,
    button_sound_type: 'beep',
    notification_sound_type: 'alert_bell',
    success_sound_type: 'chime',
    
    voice_gender: 'female',
    voice_speed: 1.0,
    voice_pitch: 1.0,
    admin_voice_enabled: true,
    client_voice_enabled: true,

    admin_new_order_voice_text: 'Nouvelle commande reçue',
    client_order_pending_voice_text: 'Votre commande est en attente',
    client_order_received_voice_text: 'Votre commande a été reçue',
    
    admin_new_order_audio_url: '',
    admin_new_order_audio_enabled: false,
    
    order_number_message: 'Commande numéro {number}',
    order_status_message: 'Votre commande est {status}',
    total_price_message: 'Total: {price}',
    order_details_message: 'Contenu: {items}'
  }),
  
  validateVoiceText: (text) => {
    if (typeof text !== 'string') return false;
    return text.length > 0 && text.length < 500;
  },

  uploadAudioFile: async (file, messageType) => {
    if (!file) throw new Error("No file provided");
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${messageType}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('sound-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('sound-files')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("SoundSettingsService: Error uploading file:", error);
      throw error;
    }
  },

  saveAudioSettings: async (settings) => {
    return await SoundSettingsService.saveAdminSoundSettings(settings);
  },

  getAudioSettings: async () => {
      return await SoundSettingsService.getAdminSoundSettings();
  }
};