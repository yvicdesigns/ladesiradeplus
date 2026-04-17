import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { playNewOrderSound } from '@/lib/soundUtils';
import { SoundSettingsService } from '@/lib/SoundSettingsService';
import { VoiceService } from '@/lib/VoiceService';

const REPEAT_INTERVAL_MS = 30_000; // 30 secondes entre chaque répétition
const MAX_DURATION_MS = 10 * 60_000; // 10 minutes maximum
// Délai entre la fin des sonneries (~2.3s) et le début de la voix
const VOICE_DELAY_MS = 2600;

export const usePersistentOrderAlert = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const soundSettingsRef = useRef(null);
  const channelRef = useRef(null);
  const pendingRef = useRef([]); // miroir de pendingOrders pour l'intervalle
  const voiceTimerRef = useRef(null);

  // Garder pendingRef synchronisé
  useEffect(() => {
    pendingRef.current = pendingOrders;
  }, [pendingOrders]);

  // Charger les paramètres audio une fois
  useEffect(() => {
    SoundSettingsService.getAdminSoundSettings()
      .then(s => { soundSettingsRef.current = s; })
      .catch(() => {});
  }, []);

  const speakAnnouncement = useCallback((count = 1) => {
    const s = soundSettingsRef.current;
    // Utiliser le texte personnalisé des paramètres, sinon le message par défaut
    const baseText = s?.admin_new_order_voice_text || 'Vous avez une nouvelle commande en attente';
    const text = count > 1
      ? `Vous avez ${count} commandes en attente`
      : baseText;

    VoiceService.speak(text, {
      lang: 'fr-FR',
      rate: s?.voice_speed ?? 1.0,
      pitch: s?.voice_pitch ?? 1.0,
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

    // Voix après la fin des 2 sonneries
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
    if (intervalRef.current) return; // déjà en cours
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;

      if (elapsed >= MAX_DURATION_MS) {
        stopRepeating();
        return;
      }

      // Rejouer uniquement s'il reste des commandes non acquittées
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

  // Souscription Supabase realtime
  useEffect(() => {
    const channelName = `persistent-alert-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'delivery_orders' },
        (payload) => {
          if (payload.new?.is_deleted === true) return;

          const newOrder = {
            id: payload.new.id,
            order_id: payload.new.order_id,
            created_at: payload.new.created_at,
          };

          setPendingOrders(prev => {
            // Éviter les doublons
            if (prev.some(o => o.id === newOrder.id)) return prev;
            return [...prev, newOrder];
          });

          // Son immédiat + début de la répétition
          playAlert();
          startRepeating();
        }
      )
      // Si une commande passe de pending → autre statut, on l'acquitte automatiquement
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'delivery_orders' },
        (payload) => {
          if (
            payload.new?.status &&
            payload.new.status !== 'pending' &&
            payload.old?.status === 'pending'
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
