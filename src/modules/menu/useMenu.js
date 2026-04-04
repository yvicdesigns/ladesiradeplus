import { useState, useEffect, useCallback } from 'react';
import { menuService } from './menuService';

export default function useMenu(restaurantId = '7eedf081-0268-4867-af38-61fa5932420a') {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [itemsRes, catRes] = await Promise.all([
      menuService.getMenuItems(restaurantId),
      menuService.getCategories(restaurantId)
    ]);
    
    if (itemsRes.error || catRes.error) {
      setError(itemsRes.error || catRes.error);
    } else {
      setItems(itemsRes.data || []);
      setCategories(catRes.data || []);
    }
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { items, categories, loading, error, refetch: fetchData };
}