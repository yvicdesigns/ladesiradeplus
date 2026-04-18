import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useReservationsCount = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = async () => {
    try {
      const { count: pendingCount, error } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('is_deleted', false); 

      if (error) throw error;
      setCount(pendingCount || 0);
    } catch (error) {
      console.error('Error fetching reservations count:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();

    const channel = supabase
      .channel(`reservations-count-sidebar-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { count, loading };
};