import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const DEFAULT_PREFS = {
  sound_enabled: true,
  toast_enabled: true
};

export const useDeliveryOrderNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  
  // Initialize prefs with safe defaults from localStorage
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('delivery_notification_prefs');
      return saved ? JSON.parse(saved) : DEFAULT_PREFS;
    } catch (e) {
      console.error('Error parsing notification prefs', e);
      return DEFAULT_PREFS;
    }
  });

  const updatePreferences = useCallback((newPrefs) => {
    setPrefs(prev => {
      const updated = { ...prev, ...newPrefs };
      localStorage.setItem('delivery_notification_prefs', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      // Get notifications specific to delivery orders
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'delivery_order')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const unread = data?.filter(n => !n.read_at) || [];
      setUnreadCount(unread.length);
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching delivery notifications:', err);
    }
  }, []);

  const markAsRead = async (orderId) => {
    try {
      // Find notification associated with this order via action_url
      const target = notifications.find(n => n.action_url?.includes(orderId) && !n.read_at);
      
      if (target) {
        await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('id', target.id);
          
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const removeNotificationForOrder = async (orderId) => {
     if (!orderId) return;
     try {
      // Find ANY notification linked to this order (read or unread)
      const target = notifications.find(n => n.action_url && n.action_url.includes(orderId));
      
      if (target) {
        console.log(`[Notifications] Removing notification ${target.id} for order ${orderId}`);
        
        await supabase
          .from('notifications')
          .delete()
          .eq('id', target.id);
          
        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== target.id));
        
        // If it was contributing to the unread count, decrease it
        if (!target.read_at) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
     } catch (err) {
       console.error('Error removing notification:', err);
     }
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('delivery-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: "type=eq.delivery_order",
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    refreshCount: fetchNotifications,
    removeNotificationForOrder,
    prefs: prefs || DEFAULT_PREFS, // Ensure prefs is never undefined
    updatePreferences
  };
};