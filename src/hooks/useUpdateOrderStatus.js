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
          // Determine table from orderMethod
          const table = orderMethod === 'restaurant' || orderMethod === 'counter'
            ? 'restaurant_orders'
            : 'delivery_orders';

          const { error: updateError } = await supabase
            .from(table)
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', orderId);

          if (updateError) throw updateError;

          // Sync status to master orders table so order history stays up-to-date
          const { data: subOrder } = await supabase
            .from(table)
            .select('order_id')
            .eq('id', orderId)
            .maybeSingle();

          if (subOrder?.order_id) {
            await supabase
              .from('orders')
              .update({ status: newStatus, updated_at: new Date().toISOString() })
              .eq('id', subOrder.order_id);
          }

          success = true;
          resultData = { data: { id: orderId, status: newStatus } };
        } catch (err) {
          attempt++;
          console.warn(`[useUpdateOrderStatus] Attempt ${attempt} failed:`, err.message);
          if (attempt >= maxRetries) throw err;
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