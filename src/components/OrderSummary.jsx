import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Truck } from 'lucide-react';

// OrderSummary is strictly conditional for deliveryFee prop.
// If deliveryFee is null, undefined, or strictly 0 (when orderType is not delivery), it won't mislead the customer.
export const OrderSummary = ({ cart, subtotal, deliveryFee, total, orderType = 'delivery' }) => {
  // Determine if we should show the delivery fee line item
  // Show if it's a delivery order, even if the fee happens to be 0 (Free delivery).
  // DO NOT show if it's a restaurant/pickup order.
  const showDeliveryFee = orderType === 'delivery' && deliveryFee !== null && deliveryFee !== undefined;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-xl p-4 shadow-md border border-gray-100 sticky top-20"
    >
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <ShoppingBag className="text-[#D97706] h-4 w-4" />
        Résumé de la commande
      </h2>

      <div className="space-y-2 mb-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
        {cart.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between p-2 rounded-lg bg-gray-50 border border-gray-100"
          >
            <div className="flex-1">
              <h3 className="text-gray-900 font-semibold text-xs">{item.name}</h3>
              <p className="text-gray-500 text-[10px] mt-0.5">Qté: {item.quantity}</p>
            </div>
            <div className="text-right pl-3">
              <p className="text-gray-900 font-bold text-xs">{(item.price * item.quantity).toLocaleString()} FCFA</p>
              <p className="text-gray-400 text-[10px] mt-0.5">{item.price} FCFA/u</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-3 space-y-2">
        <div className="flex justify-between text-gray-600">
          <span className="text-xs">Sous-total</span>
          <span className="font-medium text-xs">{subtotal.toLocaleString()} FCFA</span>
        </div>
        
        {/* Render Delivery Fee Conditionally */}
        {showDeliveryFee && (
          <div className="flex justify-between text-gray-600 items-center">
            <span className="flex items-center gap-1.5 text-xs">
              <Truck className="w-3 h-3 text-gray-400" /> Livraison
            </span>
            <span className="font-medium text-xs">
              {deliveryFee === 0 ? "Gratuite" : `${deliveryFee.toLocaleString()} FCFA`}
            </span>
          </div>
        )}
        
        <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-1">
          <span className="text-gray-900 text-sm font-bold">Total</span>
          <span className="text-[#D97706] text-base font-bold">{total.toLocaleString()} FCFA</span>
        </div>
      </div>
    </motion.div>
  );
};