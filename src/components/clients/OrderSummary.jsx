import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Trash2 } from 'lucide-react';

export const OrderSummary = ({ cart, setCart }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount || 0);
  };

  const removeItem = (itemId) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  // Example: Flat fee or percentage can be added here if needed in the future
  const total = subtotal; 

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-400 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
        <ShoppingCartIcon className="h-10 w-10 mb-2 opacity-20" />
        <p className="text-sm">Le panier est vide</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h3 className="font-bold text-gray-900 mb-3 flex justify-between items-center">
        <span>Résumé de la commande</span>
        <span className="bg-amber-100 text-amber-800 text-xs py-0.5 px-2 rounded-full">{cart.length} articles</span>
      </h3>
      
      <ScrollArea className="flex-1 -mr-3 pr-3 min-h-[200px] max-h-[300px]">
        <div className="space-y-3">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-start group">
              <div className="flex-1 pr-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900">{item.quantity}x</span>
                  <span className="text-sm text-gray-700 line-clamp-1">{item.name}</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {formatCurrency(item.price)} l'unité
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 bg-gray-50 -mx-4 px-4 pb-4 -mb-4 rounded-b-lg">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Sous-total</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-900 text-base">Total TTC</span>
          <span className="font-bold text-amber-600 text-lg">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
};

function ShoppingCartIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}