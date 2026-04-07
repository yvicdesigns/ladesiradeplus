import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { isValidStatusTransition, getValidStatusTransitionsForOrderMethod } from '@/lib/orderStatusValidation';
import { useToast } from '@/components/ui/use-toast';

export const useUpdateRestaurantOrderStatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updateLogs, setUpdateLogs] = useState([]);
  const { toast } = useToast();

  const addLog = useCallback((log) => {
    setUpdateLogs(prev => {
      const newLogs = [log, ...prev].slice(0, 5); // Keep last 5
      return newLogs;
    });
  }, []);

  const updateOrderStatus = useCallback(async (orderId, newStatus, currentStatus = null, orderMethod = null) => {
    console.log(`[RestaurantOrderStatus] updateOrderStatus called - ID: ${orderId}, new: ${newStatus}, current: ${currentStatus}, method: ${orderMethod}`);

    const timestamp = new Date().toISOString();
    let logEntry = {
      id: Date.now(),
      timestamp,
      orderId,
      currentStatus,
      newStatus,
      orderMethod,
      status: 'started',
      error: null
    };

    if (!orderId || !newStatus) {
      const msg = 'ID de commande et statut requis.';
      setError(msg);
      logEntry.status = 'failed';
      logEntry.error = msg;
      addLog(logEntry);
      return { success: false, error: msg };
    }

    // Advanced Client-side validation with orderMethod awareness
    if (currentStatus) {
      const isValid = isValidStatusTransition(currentStatus, newStatus, orderMethod);
      if (!isValid) {
        let msg = `Transition invalide: impossible de passer de '${currentStatus}' à '${newStatus}'.`;
        
        if (orderMethod === 'counter') {
           const validTransitions = getValidStatusTransitionsForOrderMethod(currentStatus, orderMethod);
           // Translate the valid statuses for the error message
           const translatedTransitions = validTransitions.map(s => s === 'served' ? 'Servie' : (s === 'cancelled' ? 'Annulée' : s));
           msg = `Les commandes au comptoir passent directement de 'En attente' aux statuts: ${translatedTransitions.join(' ou ')}.`;
        }

        setError(msg);
        logEntry.status = 'failed';
        logEntry.error = msg;
        addLog(logEntry);
        console.warn(`[RestaurantOrderStatus] Validation failed:`, msg);
        
        toast({
          title: "Action non permise",
          description: msg,
          variant: "destructive"
        });

        return { success: false, error: msg };
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      const { error: updateError } = await supabase
        .from('restaurant_orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (updateError) throw updateError;

      logEntry.status = 'success';
      addLog(logEntry);

      toast({
        title: "Statut mis à jour",
        description: `La commande est maintenant ${newStatus === 'served' ? 'servie' : newStatus}.`,
      });

      return { success: true, data: { id: orderId, status: newStatus } };
    } catch (err) {
      console.error("[RestaurantOrderStatus] Error caught during update:", err);
      
      let friendlyError = "Erreur inconnue lors de la mise à jour.";
      
      if (err.message?.includes('permission') || err.code === '42501') {
        friendlyError = "Accès refusé. Vous n'avez pas la permission d'effectuer cette action (RLS).";
      } else if (err.message?.includes('fetch') || err.message?.includes('network')) {
        friendlyError = "Erreur réseau. Vérifiez votre connexion internet.";
      } else if (err.message) {
        friendlyError = err.message;
      }
        
      setError(friendlyError);
      logEntry.status = 'failed';
      logEntry.error = friendlyError;
      addLog(logEntry);
      
      toast({
        title: "Erreur de mise à jour",
        description: friendlyError,
        variant: "destructive"
      });

      return { success: false, error: friendlyError };
    } finally {
      setLoading(false);
    }
  }, [addLog, toast]);

  return { updateOrderStatus, loading, error, updateLogs };
};