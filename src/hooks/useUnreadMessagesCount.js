import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

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

    const channel = supabase
      .channel(`messages-count-sidebar-${Date.now()}`)
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
