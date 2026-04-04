import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useStockValidation = () => {
  const [isValidating, setIsValidating] = useState(false);

  const validateCartStock = useCallback(async (cartItems) => {
    setIsValidating(true);
    try {
      if (!cartItems || cartItems.length === 0) {
        return { isValid: true, outOfStockItems: [], lowStockItems: [] };
      }

      const itemIds = cartItems.map(item => item.id || item.itemId);
      
      const { data: stockData, error } = await supabase
        .from('menu_items')
        .select('id, name, stock_quantity')
        .in('id', itemIds);

      if (error) throw error;

      const outOfStockItems = [];
      const lowStockItems = [];

      cartItems.forEach(cartItem => {
        const id = cartItem.id || cartItem.itemId;
        const dbItem = (stockData || []).find(db => db.id === id);
        
        if (!dbItem) return; // Item not found in DB

        if (dbItem.stock_quantity === 0) {
          outOfStockItems.push({ ...cartItem, name: dbItem.name, available: 0 });
        } else if (dbItem.stock_quantity < cartItem.quantity) {
          lowStockItems.push({ ...cartItem, name: dbItem.name, available: dbItem.stock_quantity, requested: cartItem.quantity });
        }
      });

      const isValid = outOfStockItems.length === 0 && lowStockItems.length === 0;

      return {
        isValid,
        outOfStockItems,
        lowStockItems
      };
    } catch (error) {
      console.error("Error validating stock:", error);
      // Fail safe - assume valid if we can't check, the DB trigger will catch it anyway
      return { isValid: true, outOfStockItems: [], lowStockItems: [], error };
    } finally {
      setIsValidating(false);
    }
  }, []);

  return {
    validateCartStock,
    isValidating
  };
};