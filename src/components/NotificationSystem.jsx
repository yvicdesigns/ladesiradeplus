import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

export const NotificationSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Unique name per user prevents "cannot add callbacks after subscribe()" error
    // when React re-renders and the effect re-runs before cleanup finishes
    const channelName = `notifications_system_${user.id}`;
    let channel;

    try {
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to INSERT and UPDATE
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const notification = payload.new;

            // Only show toast for new notifications or unread updates
            if (payload.eventType === 'INSERT' || (payload.eventType === 'UPDATE' && !notification.read_at && payload.old.read_at !== notification.read_at)) {
               toast({
                title: notification.title,
                description: notification.message,
                duration: 5000,
                className: "bg-white border-l-4 border-green-500", // Styling for better visibility
              });

              // Optionally mark as read immediately if it's a popup
              // Or let the user click it to mark as read in a notifications center
            }
          }
        )
        .subscribe();
    } catch (e) {
      // Channel already exists from a previous render — remove and recreate
      supabase.getChannels()
        .filter(c => c.topic === `realtime:${channelName}`)
        .forEach(c => supabase.removeChannel(c));
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return null;
};