import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const STORAGE_KEY = 'deliveryWorkflowSettings';
const POLL_INTERVAL_MS = 60_000; // vérification frontend toutes les 60s (backup)
const DB_ROW_ID = '00000000-0000-0000-0000-000000000099';

export const DEFAULT_WORKFLOW_SETTINGS = {
  enabled: true,
  steps: {
    pending_to_confirmed:   { enabled: true,  minutes: 3  },
    confirmed_to_preparing: { enabled: true,  minutes: 2  },
    preparing_to_ready:     { enabled: true,  minutes: 30 },
    ready_to_in_transit:    { enabled: true,  minutes: 10 },
    in_transit_to_delivered:{ enabled: false, minutes: 60 },
  }
};

export const PROGRESSION_RULES = [
  { from: 'pending',    to: 'confirmed',  key: 'pending_to_confirmed',    label: 'En attente → Confirmée' },
  { from: 'confirmed',  to: 'preparing',  key: 'confirmed_to_preparing',  label: 'Confirmée → En préparation' },
  { from: 'preparing',  to: 'ready',      key: 'preparing_to_ready',      label: 'En préparation → Prête' },
  { from: 'ready',      to: 'in_transit', key: 'ready_to_in_transit',     label: 'Prête → En route' },
  { from: 'in_transit', to: 'delivered',  key: 'in_transit_to_delivered', label: 'En route → Livrée' },
];

// Convertir la structure plate de la DB vers la structure React
const dbRowToSettings = (row) => ({
  enabled: row.enabled ?? true,
  steps: {
    pending_to_confirmed:   { enabled: true,              minutes: row.pending_to_confirmed_min   ?? 3  },
    confirmed_to_preparing: { enabled: true,              minutes: row.confirmed_to_preparing_min ?? 2  },
    preparing_to_ready:     { enabled: true,              minutes: row.preparing_to_ready_min     ?? 30 },
    ready_to_in_transit:    { enabled: true,              minutes: row.ready_to_in_transit_min    ?? 10 },
    in_transit_to_delivered:{ enabled: row.in_transit_to_delivered_enabled ?? false, minutes: row.in_transit_to_delivered_min ?? 60 },
  }
});

// Convertir la structure React vers la structure plate de la DB
const settingsToDbRow = (settings) => ({
  id: DB_ROW_ID,
  enabled: settings.enabled,
  pending_to_confirmed_min:        settings.steps.pending_to_confirmed.minutes,
  confirmed_to_preparing_min:      settings.steps.confirmed_to_preparing.minutes,
  preparing_to_ready_min:          settings.steps.preparing_to_ready.minutes,
  ready_to_in_transit_min:         settings.steps.ready_to_in_transit.minutes,
  in_transit_to_delivered_min:     settings.steps.in_transit_to_delivered.minutes,
  in_transit_to_delivered_enabled: settings.steps.in_transit_to_delivered.enabled,
  updated_at: new Date().toISOString(),
});

const loadFromLocalStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_WORKFLOW_SETTINGS,
      ...parsed,
      steps: { ...DEFAULT_WORKFLOW_SETTINGS.steps, ...parsed.steps }
    };
  } catch { return null; }
};

const saveToLocalStorage = (settings) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
};

// Avancer une commande côté frontend (backup si pg_cron non configuré)
const autoAdvanceOrder = async (orderId, fromStatus, toStatus) => {
  try {
    const { error } = await supabase
      .from('delivery_orders')
      .update({ status: toStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', fromStatus);

    if (error) throw error;

    const { data: subOrder } = await supabase
      .from('delivery_orders')
      .select('order_id')
      .eq('id', orderId)
      .maybeSingle();

    if (subOrder?.order_id) {
      await supabase
        .from('orders')
        .update({ status: toStatus, updated_at: new Date().toISOString() })
        .eq('id', subOrder.order_id);
    }
    return true;
  } catch (err) {
    console.warn('[AutoProgression] Échec avancement commande', orderId, err.message);
    return false;
  }
};

export const useOrderAutoProgression = () => {
  const [settings, setSettings] = useState(loadFromLocalStorage() ?? DEFAULT_WORKFLOW_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [dbAvailable, setDbAvailable] = useState(false);
  const { toast } = useToast();
  const intervalRef = useRef(null);
  const isRunningRef = useRef(false);

  // Charger les paramètres depuis Supabase au montage
  useEffect(() => {
    const loadFromDb = async () => {
      try {
        const { data, error } = await supabase
          .from('workflow_settings')
          .select('*')
          .eq('id', DB_ROW_ID)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const converted = dbRowToSettings(data);
          setSettings(converted);
          saveToLocalStorage(converted);
          setDbAvailable(true);
        }
      } catch {
        // Table pas encore créée — on reste sur localStorage
        setDbAvailable(false);
      }
    };
    loadFromDb();
  }, []);

  // Sauvegarder les paramètres (Supabase + localStorage)
  const updateSettings = useCallback(async (newSettings) => {
    setSettings(newSettings);
    saveToLocalStorage(newSettings);

    if (!dbAvailable) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('workflow_settings')
        .upsert(settingsToDbRow(newSettings));

      if (error) throw error;
    } catch (err) {
      console.warn('[AutoProgression] Échec sauvegarde DB:', err.message);
    } finally {
      setSaving(false);
    }
  }, [dbAvailable]);

  // Calcule le délai réel pour "preparing → ready" :
  // MAX(preparation_time) des plats commandés, ou fallback sur le délai configuré
  const getPreparingDelay = useCallback(async (orderId, fallbackMin) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('menu_items(preparation_time, category_id, menu_categories(is_beverage))')
        .eq('order_id', orderId);

      if (error || !data || data.length === 0) return fallbackMin;

      const times = data
        .filter(item => !item.menu_items?.menu_categories?.is_beverage) // skip beverages
        .map(item => item.menu_items?.preparation_time)
        .filter(t => t && t > 0);

      if (times.length === 0) return fallbackMin;
      return Math.max(...times);
    } catch {
      return fallbackMin;
    }
  }, []);

  // Vérification frontend (backup si pg_cron n'est pas activé)
  const checkAndAdvance = useCallback(async () => {
    if (isRunningRef.current) return;
    if (!settings.enabled) return;

    isRunningRef.current = true;
    try {
      const activeStatuses = PROGRESSION_RULES
        .filter(r => settings.steps[r.key]?.enabled)
        .map(r => r.from);

      if (activeStatuses.length === 0) return;

      const { data: orders, error } = await supabase
        .from('delivery_orders')
        .select('id, status, updated_at, order_id')
        .in('status', activeStatuses)
        .eq('is_deleted', false);

      if (error || !orders) return;

      const now = Date.now();
      const advanced = [];

      for (const order of orders) {
        const rule = PROGRESSION_RULES.find(r => r.from === order.status);
        if (!rule) continue;
        const step = settings.steps[rule.key];
        if (!step?.enabled) continue;

        // Pour "preparing → ready", utiliser le temps réel des plats
        let delayMin = step.minutes;
        if (rule.key === 'preparing_to_ready' && order.order_id) {
          delayMin = await getPreparingDelay(order.order_id, step.minutes);
        }

        const elapsedMin = (now - new Date(order.updated_at).getTime()) / 60_000;
        if (elapsedMin >= delayMin) {
          const success = await autoAdvanceOrder(order.id, order.status, rule.to);
          if (success) advanced.push({ from: order.status, to: rule.to });
        }
      }

      if (advanced.length > 0) {
        toast({
          title: 'Flux automatique',
          description: advanced.length === 1
            ? `Commande avancée : ${advanced[0].from} → ${advanced[0].to}`
            : `${advanced.length} commandes avancées automatiquement`,
          className: 'bg-blue-600 text-white',
          duration: 4000,
        });
      }
    } finally {
      isRunningRef.current = false;
    }
  }, [settings, toast, getPreparingDelay]);

  // Lancer le polling frontend
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (settings.enabled) {
      checkAndAdvance();
      intervalRef.current = setInterval(checkAndAdvance, POLL_INTERVAL_MS);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [settings.enabled, checkAndAdvance]);

  return { settings, updateSettings, saving, dbAvailable };
};
