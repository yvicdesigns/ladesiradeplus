-- ============================================================
-- FLUX AUTOMATIQUE DES COMMANDES DE LIVRAISON
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- ÉTAPE 1 : Créer la table des paramètres de workflow
-- ============================================================
CREATE TABLE IF NOT EXISTS workflow_settings (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled                         BOOLEAN      NOT NULL DEFAULT true,
  pending_to_confirmed_min        INTEGER      NOT NULL DEFAULT 3,
  confirmed_to_preparing_min      INTEGER      NOT NULL DEFAULT 2,
  preparing_to_ready_min          INTEGER      NOT NULL DEFAULT 30,
  ready_to_in_transit_min         INTEGER      NOT NULL DEFAULT 10,
  in_transit_to_delivered_min     INTEGER      NOT NULL DEFAULT 60,
  in_transit_to_delivered_enabled BOOLEAN      NOT NULL DEFAULT false,
  updated_at                      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Insérer la ligne de paramètres par défaut (une seule ligne)
INSERT INTO workflow_settings (
  id,
  enabled,
  pending_to_confirmed_min,
  confirmed_to_preparing_min,
  preparing_to_ready_min,
  ready_to_in_transit_min,
  in_transit_to_delivered_min,
  in_transit_to_delivered_enabled
) VALUES (
  '00000000-0000-0000-0000-000000000099',
  true,
  3,
  2,
  30,
  10,
  60,
  false
)
ON CONFLICT (id) DO NOTHING;

-- RLS : accessible en lecture/écriture par les admins authentifiés
ALTER TABLE workflow_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins peuvent lire workflow_settings"
  ON workflow_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins peuvent modifier workflow_settings"
  ON workflow_settings FOR UPDATE
  TO authenticated
  USING (true);


-- ============================================================
-- ÉTAPE 2 : Créer la fonction d'avancement automatique
-- ============================================================
CREATE OR REPLACE FUNCTION auto_advance_delivery_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  s workflow_settings%ROWTYPE;
BEGIN
  -- Charger les paramètres
  SELECT * INTO s FROM workflow_settings LIMIT 1;

  -- Si désactivé ou aucun paramètre, ne rien faire
  IF NOT FOUND OR s.enabled = false THEN
    RETURN;
  END IF;

  -- pending → confirmed
  UPDATE delivery_orders
  SET    status     = 'confirmed',
         updated_at = NOW()
  WHERE  status     = 'pending'
    AND  is_deleted = false
    AND  updated_at < NOW() - (s.pending_to_confirmed_min || ' minutes')::INTERVAL;

  -- confirmed → preparing
  UPDATE delivery_orders
  SET    status     = 'preparing',
         updated_at = NOW()
  WHERE  status     = 'confirmed'
    AND  is_deleted = false
    AND  updated_at < NOW() - (s.confirmed_to_preparing_min || ' minutes')::INTERVAL;

  -- preparing → ready
  -- Utilise le MAX(preparation_time) des plats commandés.
  -- Si aucun plat n'a de temps renseigné, utilise le délai par défaut des paramètres.
  UPDATE delivery_orders dord
  SET    status     = 'ready',
         updated_at = NOW()
  WHERE  dord.status     = 'preparing'
    AND  dord.is_deleted = false
    AND  dord.updated_at < NOW() - (
           GREATEST(
             COALESCE(
               (SELECT MAX(mi.preparation_time)
                FROM   order_items oi
                JOIN   menu_items  mi ON mi.id = oi.menu_item_id
                WHERE  oi.order_id = dord.order_id
                  AND  COALESCE(mi.preparation_time, 0) > 0),
               s.preparing_to_ready_min   -- fallback si aucun plat n'a de temps
             ),
             1   -- minimum 1 minute
           ) || ' minutes'
         )::INTERVAL;

  -- ready → in_transit
  UPDATE delivery_orders
  SET    status     = 'in_transit',
         updated_at = NOW()
  WHERE  status     = 'ready'
    AND  is_deleted = false
    AND  updated_at < NOW() - (s.ready_to_in_transit_min || ' minutes')::INTERVAL;

  -- in_transit → delivered (seulement si activé dans les paramètres)
  IF s.in_transit_to_delivered_enabled = true THEN
    UPDATE delivery_orders
    SET    status     = 'delivered',
           updated_at = NOW()
    WHERE  status     = 'in_transit'
      AND  is_deleted = false
      AND  updated_at < NOW() - (s.in_transit_to_delivered_min || ' minutes')::INTERVAL;
  END IF;

  -- Synchroniser les statuts vers la table orders principale
  -- (pour que l'historique et le suivi client restent à jour)
  UPDATE orders o
  SET    status     = dord.status,
         updated_at = NOW()
  FROM   delivery_orders dord
  WHERE  o.id        = dord.order_id
    AND  o.status   != dord.status
    AND  dord.is_deleted = false
    AND  dord.status  IN ('confirmed', 'preparing', 'ready', 'in_transit', 'delivered');

END;
$$;


-- ============================================================
-- ÉTAPE 3 : Activer pg_cron et programmer l'exécution
-- ============================================================

-- Activer l'extension pg_cron
-- (si elle n'est pas déjà activée via Dashboard → Database → Extensions)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Supprimer l'ancien job s'il existe (pour éviter les doublons)
SELECT cron.unschedule('auto-advance-delivery-orders')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'auto-advance-delivery-orders'
);

-- Programmer : toutes les minutes, tous les jours
SELECT cron.schedule(
  'auto-advance-delivery-orders',  -- nom du job
  '* * * * *',                      -- chaque minute
  'SELECT auto_advance_delivery_orders()'
);

-- ============================================================
-- VÉRIFICATION : voir les jobs programmés
-- ============================================================
-- SELECT * FROM cron.job;
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
