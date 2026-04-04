import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, X, ExternalLink, Loader2 } from 'lucide-react';
import { formatDateTime, formatCurrency } from '@/lib/formatters';
import { PAYMENT_STATUSES } from '@/lib/deliveryConstants';

export const MobileMoneyPaymentConfirmationModal = ({ order, orderType, open, onOpenChange, onConfirmSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!order) return null;

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      const table = orderType === 'delivery' ? 'delivery_orders' : 'restaurant_orders';
      // Use constant for delivery, keep string for restaurant to avoid breaking legacy code if any
      const newStatus = orderType === 'delivery' ? PAYMENT_STATUSES.CONFIRMED : 'paid';
      
      const { error } = await supabase
        .from(table)
        .update({
          payment_status: newStatus,
          payment_confirmed_at: new Date().toISOString(),
          payment_confirmed_by: user.id
        })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: "Paiement confirmé",
        description: "Le statut de la commande a été mis à jour."
      });
      
      onConfirmSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de confirmer le paiement."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vérification du Paiement</DialogTitle>
          <DialogDescription>
            Commande #{order.id?.slice(0, 8)} - {formatDateTime(order.created_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Client:</span>
              <span className="font-medium">{order.client_email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Montant:</span>
              <span className="font-bold text-primary text-lg">{formatCurrency(orderType === 'delivery' ? order.total_with_fee : order.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="capitalize font-medium">{order.mobile_money_type || 'Mobile Money'}</span>
            </div>
          </div>

          <div className="border rounded-lg p-2 bg-black/5 flex flex-col items-center">
            <span className="text-xs text-muted-foreground mb-2 w-full text-left">Preuve de paiement :</span>
            {order.payment_screenshot_url ? (
              <div className="relative group w-full">
                <img 
                  src={order.payment_screenshot_url} 
                  alt="Screenshot Paiement" 
                  className="w-full h-64 object-contain rounded bg-white border"
                />
                <a 
                  href={order.payment_screenshot_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                >
                  <Button variant="secondary" size="sm" className="gap-2">
                    <ExternalLink className="h-4 w-4" /> Ouvrir l'image
                  </Button>
                </a>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground text-sm italic w-full bg-muted rounded border border-dashed">
                Aucune capture d'écran disponible
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {(order.payment_status === PAYMENT_STATUSES.PENDING || order.payment_status === 'pending') && (
            <Button onClick={handleConfirmPayment} disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Confirmer Paiement Reçu
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};