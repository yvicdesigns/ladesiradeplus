import React, { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useLocalStorage('keyaFoodCart', []);
  const [deliveryInfo, setDeliveryInfo] = useLocalStorage('keyaFoodDeliveryInfo', null);
  const [tableInfo, setTableInfo] = useLocalStorage('keyaFoodTableInfo', null);
  const { toast } = useToast();

  const validateStock = async (itemId, requestedQuantity) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('stock_quantity, is_available, name')
        .eq('id', itemId)
        .single();
      
      if (error) throw error;
      
      if (!data.is_available) {
        return { valid: false, message: `${data.name} n'est plus disponible actuellement.` };
      }

      if (data.stock_quantity !== null && requestedQuantity > data.stock_quantity) {
        return { 
          valid: false, 
          message: `Stock insuffisant pour ${data.name}. Seulement ${data.stock_quantity} disponible(s).`,
          maxAllowed: data.stock_quantity 
        };
      }

      return { valid: true };
    } catch (err) {
      console.error("Error validating stock:", err);
      return { valid: true };
    }
  };

  const getCartKey = (item) => `${item.id}__${item.variantKey || ''}`;

  const addToCart = async (item, quantity = 1) => {
    const cartKey = getCartKey(item);
    const existingItemIndex = cart.findIndex((cartItem) => getCartKey(cartItem) === cartKey);
    const currentQtyInCart = existingItemIndex >= 0 ? cart[existingItemIndex].quantity : 0;
    const requestedQty = currentQtyInCart + quantity;

    const validation = await validateStock(item.id, requestedQty);

    if (!validation.valid) {
      toast({
        variant: "destructive",
        title: "Action impossible",
        description: validation.message,
      });
      return false;
    }

    if (existingItemIndex >= 0) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity = requestedQty;
      setCart(newCart);
    } else {
      setCart([...cart, { ...item, quantity, cartKey }]);
    }
    return true;
  };

  const removeFromCart = (itemId, variantKey) => {
    if (variantKey !== undefined) {
      setCart(cart.filter((item) => !(item.id === itemId && (item.variantKey || '') === variantKey)));
    } else {
      setCart(cart.filter((item) => item.id !== itemId));
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }

    const validation = await validateStock(itemId, quantity);
    
    if (!validation.valid) {
      toast({
        variant: "destructive",
        title: "Stock insuffisant",
        description: validation.message,
      });
      
      if (validation.maxAllowed !== undefined) {
         setCart(cart.map((item) => (item.id === itemId ? { ...item, quantity: validation.maxAllowed } : item)));
      }
      return;
    }

    setCart(cart.map((item) => (item.id === itemId ? { ...item, quantity } : item)));
  };

  const clearCart = useCallback(() => {
    setCart([]);
  }, [setCart]);

  const getItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Helper function to safely calculate the cart total ensuring orderType prevents fee logic leakage
  const getOrderTotal = (orderType = 'delivery', deliveryFee = 0) => {
    const subtotal = getSubtotal();
    const effectiveDeliveryFee = orderType === 'delivery' ? (parseFloat(deliveryFee) || 0) : 0;
    return subtotal + effectiveDeliveryFee;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemCount,
        getSubtotal,
        getOrderTotal,
        deliveryInfo,
        setDeliveryInfo,
        tableInfo,
        setTableInfo
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};