import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { debugLogger, LOG_EVENTS } from '@/lib/debugLogger';
import { useToast } from '@/components/ui/use-toast';
import { Utensils } from 'lucide-react';
import { playNewOrderSound } from '@/lib/soundUtils';
import { SoundSettingsService } from '@/lib/SoundSettingsService';

const CHANNEL_ID = `badge-restaurant-${Math.random().toString(36).slice(2)}`;

export const useNewRestaurantOrderNotificationBadge = ({ showToast = true } = {}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();
  const isMounted = useRef(true);
  const soundSettingsRef = useRef(null);
  // Refs so the effect never needs them as deps
  const toastRef = useRef(toast);
  const showToastRef = useRef(showToast);
  toastRef.current = toast;
  showToastRef.current = showToast;

  useEffect(() => {
    SoundSettingsService.getAdminSoundSettings().then(s => {
      soundSettingsRef.current = s;
    }).catch(() => {});
  }, []);

  const fetchBadgeCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('restaurant_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'new', 'preparation', 'ready'])
        .eq('is_deleted', false);

      if (error) throw error;
      if (isMounted.current && count !== null) setUnreadCount(count);
    } catch (error) {
      debugLogger.log('useNewRestaurantOrderNotificationBadge', LOG_EVENTS.ERROR, error);
    }
  }, []);

  const fetchRef = useRef(fetchBadgeCount);
  fetchRef.current = fetchBadgeCount;

  useEffect(() => {
    isMounted.current = true;
    fetchRef.current();

    // Remove any stale channel before subscribing
    supabase.getChannels()
      .filter(c => c.topic === `realtime:${CHANNEL_ID}`)
      .forEach(c => supabase.removeChannel(c));

    const channel = supabase
      .channel(CHANNEL_ID)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_orders' }, (payload) => {
        if (!isMounted.current) return;
        fetchRef.current();

        if (payload.eventType === 'INSERT' && showToastRef.current && payload.new?.is_deleted === false) {
          const s = soundSettingsRef.current;
          playNewOrderSound(
            s?.notification_volume ?? 0.8,
            s?.admin_new_order_audio_url || null,
            s?.admin_new_order_audio_enabled ?? false
          );
          toastRef.current({
            title: "🍽️ Nouvelle commande salle !",
            description: "Une nouvelle commande à table vient d'arriver.",
            className: "bg-white border-l-4 border-amber-500 shadow-lg",
            action: (
              <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Utensils className="h-5 w-5 text-amber-700 animate-pulse" />
              </div>
            ),
            duration: 6000,
          });
        }
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          debugLogger.log('useNewRestaurantOrderNotificationBadge', LOG_EVENTS.ERROR, { status, err });
        }
      });

    return () => {
      isMounted.current = false;
      supabase.removeChannel(channel);
    };
  }, []); // empty deps — channel created once

  const resetBadge = useCallback(() => setUnreadCount(0), []);

  return { unreadCount, resetBadge };
};
