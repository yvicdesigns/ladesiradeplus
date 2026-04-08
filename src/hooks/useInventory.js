import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export const useInventory = () => {
  const { toast } = useToast();
  
  const { data: ingredients, loading: loadingIngredients } = useRealtimeSubscription('ingredients', null, '*, suppliers(name)');
  const { data: suppliers, loading: loadingSuppliers } = useRealtimeSubscription('suppliers');
  const { data: orders, loading: loadingOrders } = useRealtimeSubscription('purchase_orders', null, '*, suppliers(name)');
  const { data: stockMovements, loading: loadingMovements } = useRealtimeSubscription('stock_movements', null, '*, ingredients(name, unit)');
  const { data: alerts, loading: loadingAlerts } = useRealtimeSubscription('stock_alerts', null, '*, ingredients(name)');

  const genericAction = useCallback(async (action, successMessage) => {
    try {
      await action();
      toast({ title: "Success", description: successMessage });
      return true;
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: error.message || "Operation failed", variant: "destructive" });
      return false;
    }
  }, [toast]);

  // Ingredients
  const addIngredient = (data) => genericAction(() => supabase.from('ingredients').insert([data]), "Ingredient added");
  const updateIngredient = (id, data) => genericAction(() => supabase.from('ingredients').update(data).eq('id', id), "Ingredient updated");
  const deleteIngredient = (id) => genericAction(() => supabase.from('ingredients').delete().eq('id', id), "Ingredient deleted");

  // Suppliers
  const addSupplier = (data) => genericAction(() => supabase.from('suppliers').insert([data]), "Supplier added");
  const updateSupplier = (id, data) => genericAction(() => supabase.from('suppliers').update(data).eq('id', id), "Supplier updated");
  const deleteSupplier = (id) => genericAction(() => supabase.from('suppliers').delete().eq('id', id), "Supplier deleted");

  // Orders
  const createPurchaseOrder = async (orderData, items) => {
    return genericAction(async () => {
      const { data: order, error: orderError } = await supabase.from('purchase_orders').insert([orderData]).select().single();
      if (orderError) throw orderError;
      
      const itemsWithId = items.map(item => ({ ...item, purchase_order_id: order.id }));
      const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsWithId);
      if (itemsError) throw itemsError;
    }, "Purchase order created");
  };

  const updatePurchaseOrder = (id, data) => genericAction(() => supabase.from('purchase_orders').update(data).eq('id', id), "Order updated");
  const deleteOrder = (id) => genericAction(() => supabase.from('purchase_orders').delete().eq('id', id), "Order deleted");

  // Stock Movements & Adjustments
  const addStockMovement = async (data) => {
    return genericAction(async () => {
      // 1. Create movement record
      const { error: moveError } = await supabase.from('stock_movements').insert([data]);
      if (moveError) throw moveError;

      // 2. Update ingredient stock
      // For waste/usage, we subtract. For purchase/return, we add. Adjustment can be +/- or set directly.
      // Assuming 'quantity' in data is the absolute value and 'movement_type' determines sign, 
      // or 'quantity' handles the sign. Let's assume quantity is positive and type dictates logic.
      
      const { data: ingredient } = await supabase.from('ingredients').select('current_stock').eq('id', data.ingredient_id).maybeSingle();
      let newStock = Number(ingredient.current_stock);
      const qty = Number(data.quantity);

      switch (data.movement_type) {
        case 'purchase':
        case 'return':
          newStock += qty;
          break;
        case 'usage':
        case 'waste':
          newStock -= qty;
          break;
        case 'adjustment':
          // For adjustment, usually we might send the DELTA or the NEW TOTAL.
          // Implementation: Assume 'quantity' is the DELTA.
          newStock += qty; 
          break;
      }

      const { error: updateError } = await supabase.from('ingredients').update({ current_stock: newStock }).eq('id', data.ingredient_id);
      if (updateError) throw updateError;
      
    }, "Stock movement recorded");
  };

  // Alerts
  const resolveAlert = (id) => genericAction(() => supabase.from('stock_alerts').update({ is_resolved: true }).eq('id', id), "Alert resolved");
  const deleteAlert = (id) => genericAction(() => supabase.from('stock_alerts').delete().eq('id', id), "Alert deleted");

  return {
    ingredients, loadingIngredients, addIngredient, updateIngredient, deleteIngredient,
    suppliers, loadingSuppliers, addSupplier, updateSupplier, deleteSupplier,
    orders, loadingOrders, createPurchaseOrder, updatePurchaseOrder, deleteOrder,
    stockMovements, loadingMovements, addStockMovement,
    alerts, loadingAlerts, resolveAlert, deleteAlert
  };
};