import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Smartphone, Banknote, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const PaymentOption = ({ id, name, icon: Icon, selected, onSelect }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onSelect(id)}
    className={cn(
      "cursor-pointer rounded-xl p-3 border transition-all duration-200 flex flex-col items-center justify-center text-center gap-2 h-full shadow-sm hover:shadow-md",
      selected
        ? "border-[#D97706] bg-amber-50"
        : "border-gray-100 bg-white hover:border-amber-200 hover:bg-gray-50"
    )}
  >
    <div className={cn(
      "p-2 rounded-full transition-colors",
      selected ? "bg-[#D97706] text-white" : "bg-gray-100 text-gray-500 group-hover:bg-amber-100 group-hover:text-[#D97706]"
    )}>
      <Icon className="w-4 h-4" />
    </div>
    
    <div className="w-full">
      <h3 className={cn(
        "font-bold text-xs",
        selected ? "text-[#D97706]" : "text-gray-700"
      )}>
        {name}
      </h3>
    </div>

    <div className={cn(
      "w-3 h-3 rounded-full border flex items-center justify-center mt-0.5",
      selected ? "border-[#D97706]" : "border-gray-300"
    )}>
      {selected && <div className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />}
    </div>
  </motion.div>
);

export const PaymentMethodSelector = ({ selectedMethod, onSelect }) => {
  const methods = [
    {
      id: 'cash',
      name: 'Paiement Livraison',
      icon: Banknote
    },
    {
      id: 'wallet',
      name: 'Portefeuille',
      icon: Wallet
    },
    {
      id: 'mtn',
      name: 'MTN Mobile Money',
      icon: Smartphone
    },
    {
      id: 'airtel',
      name: 'Airtel Money',
      icon: Smartphone
    }
  ];

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <CreditCard className="text-[#D97706] h-4 w-4" />
        Moyen de paiement
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {methods.map((method) => (
          <PaymentOption
            key={method.id}
            {...method}
            selected={selectedMethod === method.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};