import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { playNewOrderSound } from '@/lib/soundUtils';
import { SoundSettingsService } from '@/lib/SoundSettingsService';
import { VoiceService } from '@/lib/VoiceService';

const REPEAT_INTERVAL_MS = 30_000;
const MAX_DURATION_MS = 10 * 60_000;
const VOICE_DELAY_MS = 2600;

export const usePersistentReservationAlert = () => {
  const [pendingReservations, setPendingReservations] = useState([]);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const soundSettingsRef = useRef(null);
  const channelRef = useRef(null);
  const pendingRef = useRef([]);
  const voiceTimerRef = useRef(null);

  useEffect(() => {
    pendingRef.current = pendingReservations;
  }, [pendingReservations]);

  useEffect(() => {
    SoundSettingsService.getAdminSoundSettings()
      .then(s => { soundSettingsRef.current = s; })
      .catch(() => {});
  }, []);

  const speakAnnouncement = useCallback((count = 1) => {
    const text = count > 1
      ? `Vous avez ${count} réservations en attente de confirmation`
      : 'Vous avez une nouvelle réservation en attente de confirmation';

    VoiceService.speak(text, {
      lang: 'fr-FR',
      rate: soundSettingsRef.current?.voice_speed ?? 1.0,
      pitch: soundSettingsRef.current?.voice_pitch ?? 1.0,
      volume: 1.0,
    }).catch(() => {});
  }, []);

  const playAlert = useCallback(() => {
    console.log('[ReservationAlert] playAlert called, soundSettings:', soundSettingsRef.current);
    const s = soundSettingsRef.current;
    playNewOrderSound(
      s?.notification_volume ?? 0.9,
      s?.admin_new_order_audio_url || null,
      s?.admin_new_order_audio_enabled ?? false
    ).then(() => console.log('[ReservationAlert] sound played'))
     .catch(e => console.error('[ReservationAlert] sound error:', e));

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

  const acknowledge = useCallback((reservationId) => {
    setPendingReservations(prev => {
      const next = prev.filter(r => r.id !== reservationId);
      if (next.length === 0) stopRepeating();
      return next;
    });
  }, [stopRepeating]);

  const acknowledgeAll = useCallback(() => {
    setPendingReservations([]);
    stopRepeating();
  }, [stopRepeating]);

  useEffect(() => {
    const channel = supabase
      .channel(`persistent-reservation-alert-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reservations' },
        (payload) => {
          console.log('[ReservationAlert] INSERT event received:', payload.new?.id, 'is_deleted:', payload.new?.is_deleted);
          if (payload.new?.is_deleted === true) return;

          const newReservation = {
            id: payload.new.id,
            party_size: payload.new.party_size,
            created_at: payload.new.created_at,
          };

          setPendingReservations(prev => {
            if (prev.some(r => r.id === newReservation.id)) return prev;
            return [...prev, newReservation];
          });

          playAlert();
          startRepeating();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reservations' },
        (payload) => {
          if (payload.new?.status && payload.new.status !== 'pending' && payload.old?.status === 'pending') {
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

  return { pendingReservations, acknowledge, acknowledgeAll };
};
