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
