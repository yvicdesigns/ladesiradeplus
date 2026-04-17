import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { playNewOrderSound } from '@/lib/soundUtils';
import { SoundSettingsService } from '@/lib/SoundSettingsService';

const REPEAT_INTERVAL_MS = 30_000; // 30 secondes entre chaque répétition
const MAX_DURATION_MS = 10 * 60_000; // 10 minutes maximum

export const usePersistentOrderAlert = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const soundSettingsRef = useRef(null);
  const channelRef = useRef(null);
  const pendingRef = useRef([]); // miroir de pendingOrders pour l'intervalle

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

  const playAlert = useCallback(() => {
    const s = soundSettingsRef.current;
    playNewOrderSound(
      s?.notification_volume ?? 0.9,
      s?.admin_new_order_audio_url || null,
      s?.admin_new_order_audio_enabled ?? false
    );
  }, []);

  const stopRepeating = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
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
