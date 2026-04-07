import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Bell } from 'lucide-react';
import { playNewOrderSound } from '@/lib/soundUtils';
import { SoundSettingsService } from '@/lib/SoundSettingsService';

export const useNewOrderNotificationBadge = ({ showToast = true } = {}) => {
  const [badgeCount, setBadgeCount] = useState(0);
  const channelRef = useRef(null);
  const { toast } = useToast();
  const isMounted = useRef(true);
  const soundSettingsRef = useRef(null);

  // Load sound settings once
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

      if (isMounted.current && count !== null) {
        setBadgeCount(count);
      }
    } catch (error) {
      console.error('Error fetching notification badge count:', error);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchBadgeCount();

    if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
    }

    const channelName = `badge-count-delivery-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delivery_orders' },
        (payload) => {
          if (!isMounted.current) return;
          fetchBadgeCount();

          if (payload.eventType === 'INSERT' && showToast) {
            if (payload.new.is_deleted === true) return;

            // Play sound
            const s = soundSettingsRef.current;
            playNewOrderSound(
              s?.notification_volume ?? 0.8,
              s?.admin_new_order_audio_url || null,
              s?.admin_new_order_audio_enabled ?? false
            );

            toast({
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
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
             console.error('Realtime subscription error in badge hook', { status, err });
        }
      });

    channelRef.current = channel;

    return () => {
      isMounted.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchBadgeCount, showToast, toast]);

  const resetBadge = useCallback(() => setBadgeCount(0), []);

  return { badgeCount, resetBadge };
};