import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { playNewOrderSound } from '@/lib/soundUtils';
import { SoundSettingsService } from '@/lib/SoundSettingsService';

export const useNewReservationNotificationBadge = ({ showToast = true } = {}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef(null);
  const { toast } = useToast();
  const isMounted = useRef(true);
  const soundSettingsRef = useRef(null);

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

  useEffect(() => {
    isMounted.current = true;
    fetchCount();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`reservations-badge-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, (payload) => {
        if (!isMounted.current) return;
        fetchCount();

        console.log('[ReservationBadge] event:', payload.eventType, '| showToast:', showToast, '| is_deleted:', payload.new?.is_deleted);
        if (payload.eventType === 'INSERT' && showToast && payload.new?.is_deleted !== true) {
          console.log('[ReservationBadge] → firing toast + sound');
          const s = soundSettingsRef.current;
          playNewOrderSound(
            s?.notification_volume ?? 0.8,
            s?.admin_new_order_audio_url || null,
            s?.admin_new_order_audio_enabled ?? false
          );

          toast({
            title: "📅 Nouvelle réservation !",
            description: `Réservation pour ${payload.new?.party_size || '?'} personne(s) en attente de confirmation.`,
            className: "bg-white border-l-4 border-blue-500 shadow-lg",
            duration: 6000,
          });
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      isMounted.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchCount, showToast, toast]);

  const resetBadge = useCallback(() => setUnreadCount(0), []);

  return { unreadCount, resetBadge };
};
