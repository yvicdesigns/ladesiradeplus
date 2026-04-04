import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { isValidStatusTransition } from '@/lib/orderStatusValidation';
import { orderStatusPerformanceMonitor } from '@/lib/orderStatusPerformanceMonitor';
import { useToast } from '@/components/ui/use-toast';

export const useUpdateOrderStatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const updateOrderStatus = useCallback(async (orderId, newStatus, orderMethod = 'delivery', currentStatus = null) => {
    if (!orderId || !newStatus) {
      setError('ID de commande et statut requis.');
      return { success: false, error: 'ID de commande et statut requis.' };
    }

    // Client-side validation
    if (currentStatus && !isValidStatusTransition(currentStatus, newStatus, orderMethod)) {
      const msg = `Transition invalide: impossible de passer de '${currentStatus}' à '${newStatus}' pour le type '${orderMethod}'.`;
      setError(msg);
      return { success: false, error: msg };
    }

    setLoading(true);
    setError(null);
    const startTime = performance.now();
    const maxRetries = 3;
    let attempt = 0;
    let success = false;
    let resultData = null;

    try {
      while (attempt < maxRetries && !success) {
        try {
          const { data, error: rpcError } = await supabase.rpc('update_order_status_optimized', {
            p_order_id: orderId,
            p_new_status: newStatus
          });

          if (rpcError) throw rpcError;
          if (data && !data.success) throw new Error(data.error || 'Erreur lors de la mise à jour du statut.');

          success = true;
          resultData = data;
        } catch (err) {
          attempt++;
          console.warn(`[useUpdateOrderStatus] Attempt ${attempt} failed:`, err.message);
          if (attempt >= maxRetries) throw err;
          // Exponential backoff
          await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 200));
        }
      }

      const durationMs = performance.now() - startTime;
      orderStatusPerformanceMonitor.recordAttempt(orderId, newStatus, durationMs, true);

      return { success: true, data: resultData?.data };
    } catch (err) {
      const durationMs = performance.now() - startTime;
      orderStatusPerformanceMonitor.recordAttempt(orderId, newStatus, durationMs, false, err.message);
      
      console.error("[useUpdateOrderStatus] Error:", err);
      const friendlyError = err.message.includes('permission') 
        ? "Vous n'avez pas la permission d'effectuer cette action."
        : err.message.includes('fetch') ? "Erreur réseau. Vérifiez votre connexion."
        : err.message;
        
      setError(friendlyError);
      return { success: false, error: friendlyError };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { updateOrderStatus, loading, error };
};