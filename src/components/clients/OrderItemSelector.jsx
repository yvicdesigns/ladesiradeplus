import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Minus, PackageX } from 'lucide-react';

export const OrderItemSelector = ({ menuItems, cart, setCart }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchTerm) return menuItems;
    const lower = searchTerm.toLowerCase();
    return menuItems.filter(item => 
      item.name?.toLowerCase().includes(lower) || 
      item.description?.toLowerCase().includes(lower)
    );
  }, [menuItems, searchTerm]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount || 0);
  };

  const getCartQuantity = (itemId) => {
    const item = cart.find(i => i.id === itemId);
    return item ? item.quantity : 0;
  };

  const handleUpdateQuantity = (item, delta) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (!existing) {
        if (delta > 0) {
          return [...prev, { ...item, quantity: 1 }];
        }
        return prev;
      }

      const newQuantity = existing.quantity + delta;
      if (newQuantity <= 0) {
        return prev.filter(i => i.id !== item.id);
      }

      return prev.map(i => i.id === item.id ? { ...i, quantity: newQuantity } : i);
    });
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher un plat, une boisson..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <ScrollArea className="flex-1 pr-4 -mr-4 h-[500px]">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <PackageX className="h-12 w-12 mb-4 opacity-50" />
            <p>Aucun article trouvé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
            {filteredItems.map(item => {
              const qty = getCartQuantity(item.id);
              const isOutOfStock = item.stock_quantity !== null && item.stock_quantity <= 0;

              return (
                <Card key={item.id} className={`overflow-hidden flex flex-col transition-all ${qty > 0 ? 'border-green-500 ring-1 ring-green-500/20' : ''} ${isOutOfStock ? 'opacity-60' : ''}`}>
                  {item.image_url && (
                    <div className="h-24 bg-gray-100 relative overflow-hidden">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <h4 className="font-semibold text-sm leading-tight text-gray-900 line-clamp-2">{item.name}</h4>
                      </div>
                      <p className="font-bold text-amber-600 text-sm mt-1">{formatCurrency(item.price)}</p>
                    </div>

                    <div className="mt-3">
                      {isOutOfStock ? (
                        <Badge variant="destructive" className="w-full justify-center">Rupture de stock</Badge>
                      ) : (
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1 border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleUpdateQuantity(item, -1)}
                            disabled={qty === 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-semibold text-sm w-8 text-center">{qty}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-500 hover:text-amber-600 hover:bg-amber-50"
                            onClick={() => handleUpdateQuantity(item, 1)}
                            disabled={item.stock_quantity !== null && qty >= item.stock_quantity}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};