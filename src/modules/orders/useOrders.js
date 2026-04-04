import { useState, useEffect, useCallback } from 'react';
import { ordersService } from './ordersService';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export default function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await ordersService.getOrdersByUser(user.id);
    if (data) setOrders(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const createOrder = async (payload) => {
    return await ordersService.createOrder(payload);
  };

  const updateStatus = async (id, status) => {
    const res = await ordersService.updateOrderStatus(id, status);
    if (res.data) fetchOrders();
    return res;
  };

  return { orders, loading, fetchOrders, createOrder, updateStatus };
}