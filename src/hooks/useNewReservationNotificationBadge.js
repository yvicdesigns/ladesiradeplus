import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { playNewOrderSound } from '@/lib/soundUtils';
import { SoundSettingsService } from '@/lib/SoundSettingsService';

const CHANNEL_ID = `badge-reservations-${Math.random().toString(36).slice(2)}`;

export const useNewReservationNotificationBadge = ({ showToast = true } = {}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();
  const isMounted = useRef(true);
  const soundSettingsRef = useRef(null);
  const toastRef = useRef(toast);
  const showToastRef = useRef(showToast);
  toastRef.current = toast;
  showToastRef.current = showToast;

  useEffect(() => {
    SoundSettingsService.getAdminSoundSettings().then(s => {
      soundSettingsRef.current = s;
    }).catch(() => {});
  }, []);

  const fetchCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .not('is_deleted', 'is', true);

      if (error) throw error;
      if (isMounted.current && count !== null) setUnreadCount(count);
    } catch (err) {
      console.error('useNewReservationNotificationBadge fetch error:', err);
    }
  }, []);

  const fetchRef = useRef(fetchCount);
  fetchRef.current = fetchCount;

  useEffect(() => {
    isMounted.current = true;
    fetchRef.current();

    supabase.getChannels()
      .filter(c => c.topic === `realtime:${CHANNEL_ID}`)
      .forEach(c => supabase.removeChannel(c));

    const channel = supabase
      .channel(CHANNEL_ID)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, (payload) => {
        if (!isMounted.current) return;
        fetchRef.current();

        if (payload.eventType === 'INSERT' && showToastRef.current && payload.new?.is_deleted !== true) {
          const s = soundSettingsRef.current;
          playNewOrderSound(
            s?.notification_volume ?? 0.8,
            s?.admin_new_order_audio_url || null,
            s?.admin_new_order_audio_enabled ?? false
          );
          toastRef.current({
            title: "📅 Nouvelle réservation !",
            description: `Réservation pour ${payload.new?.party_size || '?'} personne(s) en attente de confirmation.`,
            className: "bg-white border-l-4 border-blue-500 shadow-lg",
            duration: 6000,
          });
        }
      })
      .subscribe();

    return () => {
      isMounted.current = false;
      supabase.removeChannel(channel);
    };
  }, []); // empty deps — channel created once

  const resetBadge = useCallback(() => setUnreadCount(0), []);

  return { unreadCount, resetBadge };
};
