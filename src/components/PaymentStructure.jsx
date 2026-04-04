import React from 'react';

/**
 * PaymentStructure Component
 * 
 * This component outlines the structure for the post-service payment system.
 * It is intended to be used when orders transition to 'served' status or 
 * when the customer requests the bill after dining.
 */

export const PaymentStructure = ({ 
  orderId, 
  totalAmount, 
  orderType = 'restaurant',
  onPaymentComplete 
}) => {
  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 mt-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">Système de Paiement (À venir)</h3>
      
      <div className="space-y-4 opacity-50 pointer-events-none select-none">
        {/* Mock Payment Method Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-600">Méthode de paiement</label>
          <div className="grid grid-cols-3 gap-2">
            <div className="border border-gray-200 bg-white p-3 rounded text-center text-sm text-gray-600">Espèces</div>
            <div className="border border-gray-200 bg-white p-3 rounded text-center text-sm text-gray-600">Mobile Money</div>
            <div className="border border-gray-200 bg-white p-3 rounded text-center text-sm text-gray-600">Carte</div>
          </div>
        </div>

        {/* Amount Display */}
        <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
          <span className="text-sm text-gray-600">Montant total</span>
          <span className="font-bold text-gray-900">{totalAmount} FCFA</span>
        </div>

        {/* Mock Payment Status Indicator */}
        <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
          <span className="text-sm text-gray-600">Statut du paiement</span>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">En attente</span>
        </div>

        {/* Mock Date Field */}
        <div className="text-xs text-gray-500">
          Date de transaction: --/--/----
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center italic">
        Cette fonctionnalité sera disponible dans une prochaine mise à jour.
        Pour le moment, le paiement s'effectue directement {orderType === 'delivery' ? 'à la livraison' : 'au comptoir'}.
      </p>
    </div>
  );
};