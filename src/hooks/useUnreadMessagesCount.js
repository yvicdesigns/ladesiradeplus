import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

// Stable ID generated once per module load — Date.now() could collide when
// multiple instances mount within the same millisecond
const CHANNEL_ID = `messages-count-sidebar-${Math.random().toString(36).slice(2)}`;

export const useUnreadMessagesCount = () => {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const { count: unread, error } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'client_message')
        .neq('status', 'read');

      if (error) throw error;
      setCount(unread || 0);
    } catch (err) {
      console.error('useUnreadMessagesCount fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchCount();

    // Remove any stale channel with this ID before subscribing
    supabase.getChannels()
      .filter(c => c.topic === `realtime:${CHANNEL_ID}`)
      .forEach(c => supabase.removeChannel(c));

    const channel = supabase
      .channel(CHANNEL_ID)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_notifications' }, () => {
        fetchCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCount]);

  return { count };
};
