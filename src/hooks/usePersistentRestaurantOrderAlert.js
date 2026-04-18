import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { playNewOrderSound } from '@/lib/soundUtils';
import { SoundSettingsService } from '@/lib/SoundSettingsService';
import { VoiceService } from '@/lib/VoiceService';

const REPEAT_INTERVAL_MS = 30_000;
const MAX_DURATION_MS = 10 * 60_000;
const VOICE_DELAY_MS = 2600;

export const usePersistentRestaurantOrderAlert = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const soundSettingsRef = useRef(null);
  const channelRef = useRef(null);
  const pendingRef = useRef([]);
  const voiceTimerRef = useRef(null);

  useEffect(() => {
    pendingRef.current = pendingOrders;
  }, [pendingOrders]);

  useEffect(() => {
    SoundSettingsService.getAdminSoundSettings()
      .then(s => { soundSettingsRef.current = s; })
      .catch(() => {});
  }, []);

  const speakAnnouncement = useCallback((count = 1) => {
    const text = count > 1
      ? `Vous avez ${count} commandes en salle en attente`
      : 'Vous avez une nouvelle commande en salle en attente';

    VoiceService.speak(text, {
      lang: 'fr-FR',
      rate: soundSettingsRef.current?.voice_speed ?? 1.0,
      pitch: soundSettingsRef.current?.voice_pitch ?? 1.0,
      volume: 1.0,
    }).catch(() => {});
  }, []);

  const playAlert = useCallback(() => {
    const s = soundSettingsRef.current;
    playNewOrderSound(
      s?.notification_volume ?? 0.9,
      s?.admin_new_order_audio_url || null,
      s?.admin_new_order_audio_enabled ?? false
    );

    if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current);
    voiceTimerRef.current = setTimeout(() => {
      speakAnnouncement(pendingRef.current.length);
    }, VOICE_DELAY_MS);
  }, [speakAnnouncement]);

  const stopRepeating = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (voiceTimerRef.current) {
      clearTimeout(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    VoiceService.stop();
  }, []);

  const startRepeating = useCallback(() => {
    if (intervalRef.current) return;
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed >= MAX_DURATION_MS) {
        stopRepeating();
        return;
      }
      if (pendingRef.current.length > 0) {
        playAlert();
      } else {
        stopRepeating();
      }
    }, REPEAT_INTERVAL_MS);
  }, [playAlert, stopRepeating]);

  const acknowledge = useCallback((orderId) => {
    setPendingOrders(prev => {
      const next = prev.filter(o => o.id !== orderId);
      if (next.length === 0) stopRepeating();
      return next;
    });
  }, [stopRepeating]);

  const acknowledgeAll = useCallback(() => {
    setPendingOrders([]);
    stopRepeating();
  }, [stopRepeating]);

  useEffect(() => {
    const channel = supabase
      .channel(`persistent-restaurant-alert-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'restaurant_orders' },
        (payload) => {
          if (payload.new?.is_deleted === true) return;

          const newOrder = {
            id: payload.new.id,
            table_id: payload.new.table_id,
            created_at: payload.new.created_at,
          };

          setPendingOrders(prev => {
            if (prev.some(o => o.id === newOrder.id)) return prev;
            return [...prev, newOrder];
          });

          playAlert();
          startRepeating();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'restaurant_orders' },
        (payload) => {
          if (
            payload.new?.status &&
            !['pending', 'new'].includes(payload.new.status) &&
            ['pending', 'new'].includes(payload.old?.status)
          ) {
            acknowledge(payload.new.id);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      stopRepeating();
    };
  }, [playAlert, startRepeating, stopRepeating, acknowledge]);

  return { pendingOrders, acknowledge, acknowledgeAll };
};
