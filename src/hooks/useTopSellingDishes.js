import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns';

export const useTopSellingDishes = (period = 'all') => {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopDishes = async () => {
      setLoading(true);
      setError(null);
      try {
        // We use an inner join on orders to filter by order creation date
        // and filter out cancelled/rejected orders
        let query = supabase
          .from('order_items')
          .select(`
            quantity,
            price,
            orders!inner(created_at, status),
            menu_items(id, name, image_url)
          `)
          .not('orders.status', 'in', '("cancelled","rejected")')
          .eq('is_deleted', false);

        if (period !== 'all') {
          const now = new Date();
          let startDate;
          if (period === 'today') {
            startDate = startOfDay(now);
          } else if (period === 'week') {
            startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
          } else if (period === 'month') {
            startDate = startOfMonth(now);
          }

          if (startDate) {
            query = query.gte('orders.created_at', startDate.toISOString());
          }
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        // Aggregate quantities and revenues by menu item
        const aggregated = {};
        
        data?.forEach(item => {
          if (!item.menu_items) return; // Skip orphaned items
          
          const dishId = item.menu_items.id;
          
          if (!aggregated[dishId]) {
            aggregated[dishId] = {
              id: dishId,
              name: item.menu_items.name,
              image_url: item.menu_items.image_url,
              quantity_sold: 0,
              revenue_generated: 0
            };
          }
          
          aggregated[dishId].quantity_sold += item.quantity || 0;
          aggregated[dishId].revenue_generated += (item.quantity || 0) * (item.price || 0);
        });

        // Convert to array, sort by quantity sold (descending), and take top 10
        const sortedDishes = Object.values(aggregated)
          .sort((a, b) => b.quantity_sold - a.quantity_sold)
          .slice(0, 10);

        setDishes(sortedDishes);
      } catch (err) {
        console.error('Error fetching top selling dishes:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTopDishes();
  }, [period]);

  return { dishes, loading, error };
};