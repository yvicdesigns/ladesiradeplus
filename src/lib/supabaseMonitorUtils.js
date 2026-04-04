import { supabase } from '@/lib/customSupabaseClient';

export const getSupabaseLatency = async () => {
  try {
    const start = performance.now();
    // We use a lightweight query to check connectivity
    // admin_settings is usually public read, making it good for health checks
    const { error } = await supabase.from('admin_settings').select('id').limit(1).maybeSingle();
    const end = performance.now();

    if (error) {
      // If there's an error but it's not a network error (e.g. RLS), the DB is still reachable
      const isNetworkError = error.message && (
        error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('connection')
      );
      
      return { 
        latency: Math.round(end - start), 
        ok: !isNetworkError 
      };
    }

    return { latency: Math.round(end - start), ok: true };
  } catch (err) {
    return { latency: 0, ok: false };
  }
};