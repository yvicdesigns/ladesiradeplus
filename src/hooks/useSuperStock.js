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
