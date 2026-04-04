import { useState } from 'react';
import { ordersService } from '../services/ordersService';
import { useToast } from '@/components/ui/use-toast';
import { ORDER_STATUSES } from '../constants';

export function useCancelOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const cancelOrder = async (order, reason = '') => {
    setLoading(true);
    setError(null);
    try {
      if (!order) throw new Error("Commande invalide.");
      
      // Eligibility check
      if (order.status !== ORDER_STATUSES.PENDING && order.status !== ORDER_STATUSES.CONFIRMED) {
        throw new Error("Cette commande est déjà en cours de préparation et ne peut plus être annulée.");
      }

      await ordersService.cancelOrder(order.id, reason);
      
      toast({
        title: "Commande annulée",
        description: "L'annulation a été prise en compte.",
      });
      
      return true;
    } catch (err) {
      setError(err.message);
      toast({
        title: "Échec de l'annulation",
        description: err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { cancelOrder, loading, error };
}