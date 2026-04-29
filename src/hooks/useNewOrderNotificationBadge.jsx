import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Bell } from 'lucide-react';
import { playNewOrderSound } from '@/lib/soundUtils';
import { SoundSettingsService } from '@/lib/SoundSettingsService';

const CHANNEL_ID = `badge-delivery-${Math.random().toString(36).slice(2)}`;

export const useNewOrderNotificationBadge = ({ showToast = true } = {}) => {
  const [badgeCount, setBadgeCount] = useState(0);
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

  const fetchBadgeCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('delivery_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'in_transit'])
        .eq('is_deleted', false);

      if (error) throw error;
      if (isMounted.current && count !== null) setBadgeCount(count);
    } catch (error) {
      console.error('Error fetching notification badge count:', error);
    }
  }, []);

  const fetchRef = useRef(fetchBadgeCount);
  fetchRef.current = fetchBadgeCount;

  useEffect(() => {
    isMounted.current = true;
    fetchRef.current();

    supabase.getChannels()
      .filter(c => c.topic === `realtime:${CHANNEL_ID}`)
      .forEach(c => supabase.removeChannel(c));

    const channel = supabase
      .channel(CHANNEL_ID)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_orders' }, (payload) => {
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
            title: "🔔 Nouvelle commande !",
            description: "Une nouvelle commande de livraison vient d'arriver.",
            className: "bg-white border-l-4 border-[#D97706] shadow-lg",
            action: (
              <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Bell className="h-5 w-5 text-amber-700 animate-pulse" />
              </div>
            ),
            duration: 6000,
          });
        }
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Realtime subscription error in badge hook', { status, err });
        }
      });

    return () => {
      isMounted.current = false;
      supabase.removeChannel(channel);
    };
  }, []); // empty deps — channel created once

  const resetBadge = useCallback(() => setBadgeCount(0), []);

  return { badgeCount, resetBadge };
};
