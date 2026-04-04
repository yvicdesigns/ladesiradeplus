import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { logStockUpdate } from '@/lib/stockDebugUtils';
import { executeWithResilience } from '@/lib/supabaseErrorHandler';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useStockManagement = () => {
  const [loading, setLoading] = useState(false);
  const { role } = useAuth(); // Access user role explicitly, though backend enforces it

  const getMenuItemStock = async (itemId) => {
    try {
      const data = await executeWithResilience(async () => {
        const res = await supabase.from('menu_items').select('stock_quantity').eq('id', itemId).single();
        if (res.error) throw res.error;
        return res.data;
      }, { context: `Fetch stock for item ${itemId}` });
      
      return data.stock_quantity;
    } catch (err) {
      console.error('Error fetching stock:', err);
      return null;
    }
  };

  const updateStockQuantity = async (itemId, quantityChange, isAbsolute = false, notes = '') => {
    setLoading(true);
    const changeDetails = { itemId, quantityChange, isAbsolute, notes };
    const t0 = performance.now();
    
    // Explicit UI-level role check as backup (managers are allowed)
    if (!['admin', 'manager', 'staff'].includes(role)) {
       console.warn('Unauthorized stock update attempt blocked in hook for role:', role);
       setLoading(false);
       return { success: false, error: new Error('Unauthorized role') };
    }
    
    try {
      const currentData = await executeWithResilience(async () => {
        const res = await supabase.from('menu_items').select('stock_quantity').eq('id', itemId).single();
        if (res.error) throw res.error;
        return res.data;
      }, { context: `Read stock before update (item: ${itemId})` });

      const previousQuantity = currentData.stock_quantity || 0;
      const newQuantity = isAbsolute ? quantityChange : previousQuantity + quantityChange;
      const actualChange = newQuantity - previousQuantity;

      if (newQuantity < 0) {
        throw new Error('Le stock ne peut pas être négatif');
      }

      await executeWithResilience(async () => {
        const res = await supabase.from('menu_items').update({ stock_quantity: newQuantity }).eq('id', itemId);
        if (res.error) throw res.error;
        return res;
      }, { context: `Update stock (item: ${itemId})` });

      if (actualChange !== 0) {
        await executeWithResilience(async () => {
          const res = await supabase.from('item_stock_movements').insert({
            menu_item_id: itemId,
            movement_type: 'manual_adjustment',
            quantity_changed: actualChange,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            notes: notes || 'Manual adjustment'
          });
          if (res.error) console.error("Failed to log movement:", res.error);
        }, { context: 'Insert stock movement', maxRetries: 1 });
      }

      const duration = performance.now() - t0;
      logStockUpdate(itemId, changeDetails, { previousQuantity, newQuantity }, null, duration);

      return { success: true, newQuantity };
    } catch (err) {
      const duration = performance.now() - t0;
      logStockUpdate(itemId, changeDetails, null, err, duration);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getMenuItemStock,
    updateStockQuantity
  };
};