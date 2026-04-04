import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { logger } from '@/lib/logger';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useOrderHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);

  const getCacheKey = (page) => `order_history_${user?.id}_${page}`;

  const fetchOrders = useCallback(async (page = 1, limit = 10, isLoadMore = false) => {
    if (!user) return;
    
    const cacheKey = getCacheKey(page);
    
    if (!isLoadMore) {
        setLoading(true);
        setError(null);
        
        // Attempt Cache Read
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < CACHE_TTL) {
                    setOrders(parsed.data);
                    setIsFromCache(true);
                    setLoading(false);
                    // Fetch fresh in background
                    fetchFresh(page, limit, isLoadMore, cacheKey);
                    return;
                } else {
                    localStorage.removeItem(cacheKey);
                }
            } catch(e) {
                localStorage.removeItem(cacheKey);
            }
        }
    }

    await fetchFresh(page, limit, isLoadMore, cacheKey);
  }, [user]);

  const fetchFresh = async (page, limit, isLoadMore, cacheKey, attempt = 1) => {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Wrap in 15 second timeout for Task 5 requirements
      // Added delivery_orders and restaurant_orders to prevent N+1 queries later
      const fetchPromise = supabase
        .from('orders')
        .select(`
          id, 
          created_at, 
          status, 
          total, 
          type,
          order_items(id, quantity, price, menu_items(name, image_url)),
          delivery_orders(status, delivery_fee, estimated_delivery_time_text),
          restaurant_orders(status, payment_status)
        `)
        .eq('user_id', user.id)
        .or('is_deleted.eq.false,is_deleted.is.null')
        .order('created_at', { ascending: false })
        .range(from, to);
        
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 15000));
      
      const { data, error: fetchError } = await Promise.race([fetchPromise, timeoutPromise]);

      if (fetchError) throw fetchError;

      if (data) {
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
        
        setOrders(prev => {
          if (isLoadMore) {
            const existingIds = new Set(prev.map(o => o.id));
            const newOrders = data.filter(o => !existingIds.has(o.id));
            return [...prev, ...newOrders];
          }
          return data;
        });
        
        setHasMore(data.length === limit);
        setIsFromCache(false);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      if (err.message === 'TIMEOUT' && attempt < 3) {
         logger.warn(`[useOrderHistory] Timeout on attempt ${attempt}. Retrying...`);
         setTimeout(() => fetchFresh(page, limit, isLoadMore, cacheKey, attempt + 1), 1000 * attempt);
         return;
      }
      
      logger.error('[useOrderHistory] Error fetching history:', err);
      if (!isFromCache && !isLoadMore) {
          setError(err.message === 'TIMEOUT' ? "Délai d'attente dépassé (Timeout). Le serveur est lent. Veuillez réessayer." : "Impossible de charger l'historique de vos commandes.");
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshHistory = () => {
      fetchOrders(1, 10, false);
  };

  const invalidateCache = () => {
     if (!user) return;
     for(let i=1; i<=3; i++) {
        localStorage.removeItem(`order_history_${user.id}_${i}`);
     }
  };

  return { orders, loading, error, hasMore, isFromCache, fetchOrders, refreshHistory, invalidateCache };
};