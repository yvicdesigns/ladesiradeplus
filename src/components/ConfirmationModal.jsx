import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';

export const ConfirmationModal = ({
  open,
  onOpenChange,
  onConfirm,
  loading,
  formData,
  paymentMethod,
  total
}) => {
  const getPaymentLabel = (method) => {
    switch(method) {
      case 'cash': return 'Paiement à la livraison';
      case 'mtn': return 'MTN Mobile Money';
      case 'airtel': return 'Airtel Money';
      case 'wallet': return 'Portefeuille';
      default: return method;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white text-gray-900 border-gray-100 sm:max-w-[400px] p-4 shadow-xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-gray-900">
            <CheckCircle className="text-[#D97706] h-5 w-5" />
            Confirmer la commande
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-xs">
            Vérifiez les détails avant de valider.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-1">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <h4 className="font-bold text-[#D97706] mb-1 text-xs uppercase tracking-wider">Adresse de Livraison</h4>
            <div className="space-y-0.5 text-xs text-gray-700">
              <p className="font-medium text-gray-900">{formData.fullName}</p>
              <p>{formData.address}</p>
              <p>{formData.phone}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-500 text-xs">Méthode de paiement</span>
              <span className="font-semibold text-gray-900 text-xs">{getPaymentLabel(paymentMethod)}</span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-1">
              <span className="text-sm font-bold text-gray-900">Total à payer</span>
              <span className="text-lg font-bold text-[#D97706]">{total.toFixed(2)} $</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-9 text-xs border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium"
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            className="w-full sm:w-auto h-9 text-xs bg-[#D97706] hover:bg-[#FCD34D] text-white font-bold shadow-md shadow-green-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Traitement...
              </>
            ) : (
              'Confirmer & Payer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};