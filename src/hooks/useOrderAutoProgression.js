import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const STORAGE_KEY = 'deliveryWorkflowSettings';
const POLL_INTERVAL_MS = 60_000; // vérification toutes les 60 secondes

export const DEFAULT_WORKFLOW_SETTINGS = {
  enabled: true,
  steps: {
    pending_to_confirmed:   { enabled: true,  minutes: 3  },
    confirmed_to_preparing: { enabled: true,  minutes: 2  },
    preparing_to_ready:     { enabled: true,  minutes: 30 },
    ready_to_in_transit:    { enabled: true,  minutes: 10 },
    in_transit_to_delivered:{ enabled: false, minutes: 60 }, // manuel par défaut
  }
};

export const PROGRESSION_RULES = [
  { from: 'pending',    to: 'confirmed',  key: 'pending_to_confirmed',    label: 'En attente → Confirmée' },
  { from: 'confirmed',  to: 'preparing',  key: 'confirmed_to_preparing',  label: 'Confirmée → En préparation' },
  { from: 'preparing',  to: 'ready',      key: 'preparing_to_ready',      label: 'En préparation → Prête' },
  { from: 'ready',      to: 'in_transit', key: 'ready_to_in_transit',     label: 'Prête → En route' },
  { from: 'in_transit', to: 'delivered',  key: 'in_transit_to_delivered', label: 'En route → Livrée' },
];

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WORKFLOW_SETTINGS;
    const parsed = JSON.parse(raw);
    // Fusionner avec les défauts pour les clés manquantes
    return {
      ...DEFAULT_WORKFLOW_SETTINGS,
      ...parsed,
      steps: { ...DEFAULT_WORKFLOW_SETTINGS.steps, ...parsed.steps }
    };
  } catch {
    return DEFAULT_WORKFLOW_SETTINGS;
  }
};

const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
};

// Avancer le statut directement via Supabase (opération de fond, silencieuse)
const autoAdvanceOrder = async (orderId, fromStatus, toStatus) => {
  try {
    const { error } = await supabase
      .from('delivery_orders')
      .update({ status: toStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', fromStatus); // guard: ne met à jour que si le statut n'a pas changé entre-temps

    if (error) throw error;

    // Synchroniser la table orders principale
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
  const [settings, setSettings] = useState(loadSettings);
  const { toast } = useToast();
  const intervalRef = useRef(null);
  const isRunningRef = useRef(false);

  const updateSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  const checkAndAdvance = useCallback(async () => {
    if (isRunningRef.current) return; // éviter les chevauchements
    if (!settings.enabled) return;

    isRunningRef.current = true;

    try {
      // Récupérer toutes les commandes actives non supprimées
      const activeStatuses = PROGRESSION_RULES
        .filter(r => settings.steps[r.key]?.enabled)
        .map(r => r.from);

      if (activeStatuses.length === 0) return;

      const { data: orders, error } = await supabase
        .from('delivery_orders')
        .select('id, status, updated_at')
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

        const updatedAt = new Date(order.updated_at).getTime();
        const elapsedMin = (now - updatedAt) / 60_000;

        if (elapsedMin >= step.minutes) {
          const success = await autoAdvanceOrder(order.id, order.status, rule.to);
          if (success) {
            advanced.push({ id: order.id, from: order.status, to: rule.to });
          }
        }
      }

      if (advanced.length > 0) {
        const label = advanced.length === 1
          ? `Commande avancée automatiquement : ${advanced[0].from} → ${advanced[0].to}`
          : `${advanced.length} commandes avancées automatiquement`;

        toast({
          title: 'Flux automatique',
          description: label,
          className: 'bg-blue-600 text-white',
          duration: 4000,
        });
      }
    } finally {
      isRunningRef.current = false;
    }
  }, [settings, toast]);

  // Lancer/arrêter le polling selon l'état activé
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (settings.enabled) {
      // Première vérification immédiate au chargement
      checkAndAdvance();
      intervalRef.current = setInterval(checkAndAdvance, POLL_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [settings.enabled, checkAndAdvance]);

  return { settings, updateSettings };
};
