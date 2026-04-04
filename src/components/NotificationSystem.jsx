import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

export const NotificationSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications_system')
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  return null;
};