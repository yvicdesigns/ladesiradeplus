import { useState } from 'react';
import { ordersService } from '../services/ordersService';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export function useCreateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const createOrder = async (orderData) => {
    setLoading(true);
    setError(null);
    try {
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error("La commande doit contenir au moins un article.");
      }

      const payload = {
        ...orderData,
        user_id: user?.id || null,
        // Fallback default restaurant if not provided
        restaurant_id: orderData.restaurant_id || '7eedf081-0268-4867-af38-61fa5932420a',
      };

      const newOrderId = await ordersService.createOrderAtomic(payload);
      setOrderId(newOrderId);
      
      toast({
        title: "Commande validée !",
        description: "Votre commande a été créée avec succès.",
        className: "bg-green-600 text-white",
      });
      
      return newOrderId;
    } catch (err) {
      setError(err.message);
      toast({
        title: "Erreur",
        description: err.message || "Impossible de créer la commande.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createOrder, loading, error, orderId };
}