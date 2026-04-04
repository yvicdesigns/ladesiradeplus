import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, XCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { 
  getNextStatus, 
  getActionLabel, 
  DELIVERY_STATUSES,
  STATUS_PENDING,
  STATUS_CONFIRMED,
  STATUS_PREPARING,
  STATUS_READY,
  STATUS_IN_TRANSIT,
  STATUS_DELIVERED,
  STATUS_CANCELLED,
  STATUS_ARRIVED_AT_CUSTOMER
} from '@/lib/deliveryConstants';

export const DeliveryActionButtons = ({ order, onUpdateStatus, loading, className = "" }) => {
  const currentStatus = order?.status;
  const nextStatus = getNextStatus(currentStatus);
  const currentStatusConfig = DELIVERY_STATUSES.find(s => s.key === currentStatus);
  
  if (!order) {
    return (
      <div className="p-4 border border-dashed rounded bg-gray-50 text-gray-500 text-center">
        <HelpCircle className="w-6 h-6 mx-auto mb-2 opacity-50"/>
        Données manquantes
      </div>
    );
  }

  const isCancelled = currentStatus === STATUS_CANCELLED || currentStatus === 'rejected';
  const isDelivered = currentStatus === STATUS_DELIVERED;
  
  const handleNextAction = () => {
    if (nextStatus) {
      onUpdateStatus(nextStatus, 'admin'); 
    }
  };

  const handleCancel = () => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      onUpdateStatus(STATUS_CANCELLED, 'admin');
    }
  };

  return (
    <div className={`flex flex-col gap-5 p-5 border rounded-xl bg-white shadow-sm transition-all ${className}`}>
      
      {/* 1. Status Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Statut actuel</span>
        <Badge className={`${currentStatusConfig?.color || 'bg-gray-100'} text-sm px-4 py-1.5 border-0 shadow-sm capitalize`}>
          {currentStatusConfig?.label || currentStatus}
        </Badge>
      </div>

      {/* 2. Action Area */}
      <div className="flex flex-col gap-3 w-full">
        {loading ? (
            <Button disabled className="w-full h-12 bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Traitement...
            </Button>
        ) : (
            <>
                {/* PRIMARY ACTION: Next Step */}
                {!isCancelled && !isDelivered && nextStatus && (
                    <Button 
                        onClick={handleNextAction} 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base font-bold h-14 shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {getActionLabel(nextStatus)}
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                )}

                {/* SECONDARY ACTION: Cancel */}
                {[STATUS_PENDING, STATUS_CONFIRMED, STATUS_PREPARING, STATUS_READY, STATUS_IN_TRANSIT].includes(currentStatus) && !isCancelled && !isDelivered && (
                    <Button 
                        variant="outline" 
                        onClick={handleCancel}
                        className="w-full h-10 mt-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors flex items-center justify-center gap-2"
                    >
                        <XCircle className="h-4 w-4" />
                        Annuler la commande
                    </Button>
                )}
            </>
        )}
      </div>

      {/* 3. Terminal State Feedback */}
      {isDelivered && (
          <div className="flex items-center justify-center gap-2 p-4 bg-amber-50 text-amber-800 rounded-lg border border-green-100 font-medium">
              <CheckCircle className="h-5 w-5" />
              Livraison terminée avec succès.
          </div>
      )}
      {isCancelled && (
          <div className="flex items-center justify-center gap-2 p-4 bg-red-50 text-red-800 rounded-lg border border-red-100 font-medium">
              <XCircle className="h-5 w-5" />
              Commande annulée.
          </div>
      )}
    </div>
  );
};