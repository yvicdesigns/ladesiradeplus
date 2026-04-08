import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { logStockFetch } from '@/lib/stockDebugUtils';
import { executeWithResilience, getFriendlyErrorMessage } from '@/lib/supabaseErrorHandler';

export const useStockMovements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchMovements = useCallback(async ({ page = 1, limit = 10, menuItemId = null, movementType = 'all', startDate = null, endDate = null }) => {
    setLoading(true);
    setError(null);
    const t0 = performance.now();
    
    try {
      const response = await executeWithResilience(async () => {
        let query = supabase
          .from('item_stock_movements')
          .select('id, menu_item_id, movement_type, quantity_changed, previous_quantity, new_quantity, order_id, notes, created_at', { count: 'exact' });

        if (menuItemId) query = query.eq('menu_item_id', menuItemId);
        if (movementType && movementType !== 'all') query = query.eq('movement_type', movementType);
        if (startDate) query = query.gte('created_at', startDate);
        if (endDate) query = query.lte('created_at', endDate);

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const res = await query.order('created_at', { ascending: false }).range(from, to);
        if (res.error) throw res.error;

        // Fetch menu item names separately (no FK defined)
        const itemIds = [...new Set((res.data || []).map(m => m.menu_item_id).filter(Boolean))];
        let itemNames = {};
        if (itemIds.length > 0) {
          const { data: items } = await supabase
            .from('menu_items')
            .select('id, name')
            .in('id', itemIds);
          (items || []).forEach(i => { itemNames[i.id] = i.name; });
        }

        return {
          ...res,
          data: (res.data || []).map(m => ({
            ...m,
            menu_items: { name: itemNames[m.menu_item_id] || 'Produit inconnu' }
          }))
        };
      }, { context: 'Fetch stock movements' });

      setMovements(response.data || []);
      setTotalCount(response.count || 0);
      
      const duration = performance.now() - t0;
      logStockFetch('item_stock_movements', { page, limit, menuItemId }, null, response.data?.length, duration);
    } catch (err) {
      const friendlyMsg = getFriendlyErrorMessage(err);
      setError(friendlyMsg);
      const duration = performance.now() - t0;
      logStockFetch('item_stock_movements', { page, limit, menuItemId }, err, 0, duration);
    } finally {
      setLoading(false);
    }
  }, []);

  return { movements, loading, error, totalCount, fetchMovements };
};