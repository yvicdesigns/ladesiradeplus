import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export function useMenuItemIngredients(menuItemId) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!menuItemId) { setLinks([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('menu_item_ingredients')
      .select('id, quantity_per_serving, unit, ingredient_id, ingredients(id, name, unit, current_stock)')
      .eq('menu_item_id', menuItemId);
    setLinks(data || []);
    setLoading(false);
  }, [menuItemId]);

  useEffect(() => { fetch(); }, [fetch]);

  const saveLinks = async (menuItemId, newLinks) => {
    await supabase.from('menu_item_ingredients').delete().eq('menu_item_id', menuItemId);
    if (newLinks.length === 0) return;
    const rows = newLinks.map(l => ({
      menu_item_id: menuItemId,
      ingredient_id: l.ingredient_id,
      quantity_per_serving: parseFloat(l.quantity_per_serving) || 1,
      unit: l.unit || null,
    }));
    await supabase.from('menu_item_ingredients').insert(rows);
  };

  return { links, loading, refetch: fetch, saveLinks };
}

// Validate that all ingredients for the given cart items have enough stock
export async function validateIngredientStock(cartItems) {
  if (!cartItems?.length) return { valid: true, errors: [] };

  const itemIds = cartItems.map(i => i.id || i.menu_item_id);
  const { data: links } = await supabase
    .from('menu_item_ingredients')
    .select('menu_item_id, quantity_per_serving, ingredient_id, ingredients(id, name, current_stock, unit)')
    .in('menu_item_id', itemIds);

  if (!links?.length) return { valid: true, errors: [] };

  // Aggregate total needed per ingredient
  const needed = {};
  for (const cartItem of cartItems) {
    const itemId = cartItem.id || cartItem.menu_item_id;
    const itemLinks = links.filter(l => l.menu_item_id === itemId);
    for (const link of itemLinks) {
      const ingId = link.ingredient_id;
      if (!needed[ingId]) needed[ingId] = { ingredient: link.ingredients, total: 0 };
      needed[ingId].total += link.quantity_per_serving * cartItem.quantity;
    }
  }

  const errors = [];
  for (const [, { ingredient, total }] of Object.entries(needed)) {
    if (ingredient.current_stock !== null && ingredient.current_stock < total) {
      errors.push({
        name: ingredient.name,
        available: ingredient.current_stock,
        needed: total,
        unit: ingredient.unit,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

// Restore ingredient stock when an order is cancelled
export async function restoreIngredientStock(cartItems, orderId) {
  const itemIds = cartItems.map(i => i.id || i.menu_item_id);
  const { data: links } = await supabase
    .from('menu_item_ingredients')
    .select('menu_item_id, quantity_per_serving, ingredient_id, ingredients(id, name, current_stock, unit)')
    .in('menu_item_id', itemIds);

  if (!links?.length) return;

  const restorations = {};
  for (const cartItem of cartItems) {
    const itemId = cartItem.id || cartItem.menu_item_id;
    const itemLinks = links.filter(l => l.menu_item_id === itemId);
    for (const link of itemLinks) {
      const ingId = link.ingredient_id;
      if (!restorations[ingId]) restorations[ingId] = { ingredient: link.ingredients, total: 0 };
      restorations[ingId].total += link.quantity_per_serving * cartItem.quantity;
    }
  }

  for (const [ingId, { ingredient, total }] of Object.entries(restorations)) {
    if (ingredient.current_stock === null) continue;
    const newStock = ingredient.current_stock + total;
    await supabase.from('ingredients').update({ current_stock: newStock }).eq('id', ingId);
    await supabase.from('stock_movements').insert({
      ingredient_id: ingId,
      movement_type: 'order_cancelled',
      quantity: total,
      reference_id: orderId,
      notes: 'Remise en stock - annulation commande',
    });
  }
}

// Restore all stock (menu items + ingredients) when an order is cancelled
export async function restoreStockOnCancellation(ordersId) {
  if (!ordersId) return;

  const { data: items } = await supabase
    .from('order_items')
    .select('id, menu_item_id, quantity')
    .eq('order_id', ordersId)
    .eq('is_deleted', false);

  if (!items?.length) return;

  // Restore menu_items stock_quantity
  const itemIds = items.map(i => i.menu_item_id);
  const { data: stockData } = await supabase
    .from('menu_items')
    .select('id, stock_quantity')
    .in('id', itemIds);

  for (const item of items) {
    const dbItem = stockData?.find(i => i.id === item.menu_item_id);
    if (dbItem && dbItem.stock_quantity !== null) {
      const newStock = dbItem.stock_quantity + item.quantity;
      await supabase.from('menu_items').update({ stock_quantity: newStock }).eq('id', item.menu_item_id);
      await supabase.from('item_stock_movements').insert({
        menu_item_id: item.menu_item_id,
        movement_type: 'order_cancelled',
        quantity_changed: item.quantity,
        previous_quantity: dbItem.stock_quantity,
        new_quantity: newStock,
        order_id: ordersId,
        notes: 'Remise en stock - annulation commande',
      });
    }
  }

  // Restore ingredient stock
  const cartItems = items.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity }));
  await restoreIngredientStock(cartItems, ordersId);
}

// Deduct ingredient stock after order confirmation
export async function deductIngredientStock(cartItems, orderId) {
  const itemIds = cartItems.map(i => i.id || i.menu_item_id);
  const { data: links } = await supabase
    .from('menu_item_ingredients')
    .select('menu_item_id, quantity_per_serving, ingredient_id, ingredients(id, name, current_stock, unit)')
    .in('menu_item_id', itemIds);

  if (!links?.length) return;

  const deductions = {};
  for (const cartItem of cartItems) {
    const itemId = cartItem.id || cartItem.menu_item_id;
    const itemLinks = links.filter(l => l.menu_item_id === itemId);
    for (const link of itemLinks) {
      const ingId = link.ingredient_id;
      if (!deductions[ingId]) deductions[ingId] = { ingredient: link.ingredients, total: 0 };
      deductions[ingId].total += link.quantity_per_serving * cartItem.quantity;
    }
  }

  for (const [ingId, { ingredient, total }] of Object.entries(deductions)) {
    if (ingredient.current_stock === null) continue;
    const newStock = Math.max(0, ingredient.current_stock - total);
    await supabase.from('ingredients').update({ current_stock: newStock }).eq('id', ingId);
    await supabase.from('stock_movements').insert({
      ingredient_id: ingId,
      movement_type: 'usage',
      quantity: -total,
      reference_id: orderId,
      notes: `Déduction commande`,
    });
  }
}
