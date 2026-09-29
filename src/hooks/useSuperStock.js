import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

// Current-state data: ingredients, their remaining FIFO lots and the locations
// those lots live in. Read-only (Phase 2 of Super Stock) -- no mutations here.
export function useSuperStock() {
  const [ingredients, setIngredients] = useState([]);
  const [lots, setLots] = useState([]);
  const [locations, setLocations] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [ingRes, lotsRes, locRes, movRes] = await Promise.all([
      supabase.from('ingredients').select('*').or('is_deleted.eq.false,is_deleted.is.null').order('name'),
      supabase.from('stock_lots').select('*').or('is_deleted.eq.false,is_deleted.is.null').gt('quantity_remaining', 0),
      supabase.from('stock_locations').select('*').or('is_deleted.eq.false,is_deleted.is.null'),
      supabase.from('stock_movements').select('*, ingredients(name, unit)').order('created_at', { ascending: false }).limit(20),
    ]);
    setIngredients(ingRes.data || []);
    setLots(lotsRes.data || []);
    setLocations(locRes.data || []);
    setRecentMovements(movRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { ingredients, lots, locations, recentMovements, loading, refetch: load };
}

// Inventory counts list, with started/validated-by names resolved client-side
// (inventory_counts.started_by/validated_by reference auth.users, not profiles,
// so PostgREST can't embed profiles directly -- no FK between the two tables).
export function useInventoryCounts() {
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('inventory_counts').select('*').order('created_at', { ascending: false });
    const rows = data || [];
    const userIds = [...new Set(rows.flatMap(r => [r.started_by, r.validated_by]).filter(Boolean))];
    let profilesById = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', userIds);
      profilesById = Object.fromEntries((profiles || []).map(p => [p.user_id, p.full_name]));
    }
    setCounts(rows.map(r => ({ ...r, startedByName: profilesById[r.started_by], validatedByName: profilesById[r.validated_by] })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { counts, loading, refetch: load };
}

export function useInventoryCountItems(countId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!countId) return;
    setLoading(true);
    const { data } = await supabase
      .from('inventory_count_items')
      .select('*, ingredients(name, unit, category)')
      .eq('inventory_count_id', countId)
      .order('id');
    setItems(data || []);
    setLoading(false);
  }, [countId]);

  useEffect(() => { load(); }, [load]);

  return { items, loading, refetch: load };
}

// Théorique (recipe x actual sales) vs réel (everything that actually left the
// shelf: sale deductions, manual sorties, waste...) per ingredient over a period.
// Réel intentionally includes ALL negative movements, not just checkout-driven
// ones -- checkout deductions are themselves recipe-derived, so comparing
// théorique only against checkout movements would always show zero variance.
// The real signal comes from manual sorties, waste/breakage and inventory
// adjustments layered on top.
export function useTheoreticalVsReal(fromISO, toISO) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!fromISO || !toISO) return;
    setLoading(true);

    const [ordersRes, recipesRes, ingredientsRes] = await Promise.all([
      supabase.from('orders').select('id').gte('created_at', fromISO).lte('created_at', toISO).neq('status', 'cancelled'),
      supabase.from('menu_item_ingredients').select('menu_item_id, ingredient_id, quantity_per_serving'),
      supabase.from('ingredients').select('id, name, unit').or('is_deleted.eq.false,is_deleted.is.null'),
    ]);

    const orderIds = (ordersRes.data || []).map(o => o.id);
    const recipes = recipesRes.data || [];
    const ingredientsById = {};
    (ingredientsRes.data || []).forEach(i => { ingredientsById[i.id] = i; });

    let orderItems = [];
    if (orderIds.length > 0) {
      const { data } = await supabase.from('order_items').select('menu_item_id, quantity, order_id').in('order_id', orderIds).eq('is_deleted', false);
      orderItems = data || [];
    }

    const recipesByMenuItem = {};
    recipes.forEach(r => {
      if (!recipesByMenuItem[r.menu_item_id]) recipesByMenuItem[r.menu_item_id] = [];
      recipesByMenuItem[r.menu_item_id].push(r);
    });

    const theoretical = {};
    orderItems.forEach(oi => {
      const links = recipesByMenuItem[oi.menu_item_id] || [];
      links.forEach(link => {
        theoretical[link.ingredient_id] = (theoretical[link.ingredient_id] || 0) + link.quantity_per_serving * oi.quantity;
      });
    });

    const { data: movements } = await supabase
      .from('stock_movements')
      .select('ingredient_id, quantity')
      .gte('created_at', fromISO)
      .lte('created_at', toISO)
      .lt('quantity', 0);

    const real = {};
    (movements || []).forEach(m => {
      real[m.ingredient_id] = (real[m.ingredient_id] || 0) + Math.abs(Number(m.quantity));
    });

    const ingredientIds = new Set([...Object.keys(theoretical), ...Object.keys(real)]);
    const result = Array.from(ingredientIds).map(id => {
      const t = theoretical[id] || 0;
      const r = real[id] || 0;
      const variance = r - t;
      return {
        ingredientId: id,
        name: ingredientsById[id]?.name || 'Ingrédient supprimé',
        unit: ingredientsById[id]?.unit || '',
        theoretical: t,
        real: r,
        variance,
        variancePct: t > 0 ? (variance / t) * 100 : null,
      };
    }).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

    setRows(result);
    setLoading(false);
  }, [fromISO, toISO]);

  useEffect(() => { load(); }, [load]);

  return { rows, loading, refetch: load };
}

// 60-day movement window + recent validated inventory variances, used to derive
// alerts (loss trends, stale stock, price spikes, big inventory variances).
// Thresholds are sensible defaults for now, not yet per-restaurant configurable.
export function useAlertSignals() {
  const [movements, setMovements] = useState([]);
  const [variances, setVariances] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - 60);

    const [movRes, varRes] = await Promise.all([
      supabase.from('stock_movements').select('*, ingredients(name, unit)').gte('created_at', since.toISOString()).order('created_at', { ascending: true }),
      supabase.from('inventory_count_items').select('*, ingredients(name, unit), inventory_counts!inner(status, validated_at)').eq('inventory_counts.status', 'validated').order('created_at', { ascending: false }).limit(200),
    ]);
    setMovements(movRes.data || []);
    setVariances(varRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { movements, variances, loading, refetch: load };
}

// Period-scoped movements for the dashboard KPIs (entrées/sorties/pertes du jour, etc.)
export function useSuperStockMovements(fromISO, toISO) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!fromISO || !toISO) return;
    setLoading(true);
    const { data } = await supabase
      .from('stock_movements')
      .select('*, ingredients(name, unit)')
      .gte('created_at', fromISO)
      .lte('created_at', toISO)
      .order('created_at', { ascending: false });
    setMovements(data || []);
    setLoading(false);
  }, [fromISO, toISO]);

  useEffect(() => { load(); }, [load]);

  return { movements, loading, refetch: load };
}
