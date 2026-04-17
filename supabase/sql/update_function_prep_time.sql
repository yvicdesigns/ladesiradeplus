-- ============================================================
-- MISE À JOUR : Temps de préparation dynamique par plat
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- (La table et le cron sont déjà en place — on met juste à jour la fonction)
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

  -- pending → confirmed (délai fixe)
  UPDATE delivery_orders
  SET    status     = 'confirmed',
         updated_at = NOW()
  WHERE  status     = 'pending'
    AND  is_deleted = false
    AND  updated_at < NOW() - (s.pending_to_confirmed_min || ' minutes')::INTERVAL;

  -- confirmed → preparing (délai fixe)
  UPDATE delivery_orders
  SET    status     = 'preparing',
         updated_at = NOW()
  WHERE  status     = 'confirmed'
    AND  is_deleted = false
    AND  updated_at < NOW() - (s.confirmed_to_preparing_min || ' minutes')::INTERVAL;

  -- preparing → ready
  -- Délai DYNAMIQUE : MAX(preparation_time) des plats de la commande.
  -- Si aucun plat n'a de temps renseigné → fallback sur le délai des paramètres.
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
               s.preparing_to_ready_min
             ),
             1
           ) || ' minutes'
         )::INTERVAL;

  -- ready → in_transit (délai fixe)
  UPDATE delivery_orders
  SET    status     = 'in_transit',
         updated_at = NOW()
  WHERE  status     = 'ready'
    AND  is_deleted = false
    AND  updated_at < NOW() - (s.ready_to_in_transit_min || ' minutes')::INTERVAL;

  -- in_transit → delivered (seulement si activé)
  IF s.in_transit_to_delivered_enabled = true THEN
    UPDATE delivery_orders
    SET    status     = 'delivered',
           updated_at = NOW()
    WHERE  status     = 'in_transit'
      AND  is_deleted = false
      AND  updated_at < NOW() - (s.in_transit_to_delivered_min || ' minutes')::INTERVAL;
  END IF;

  -- Synchroniser les statuts vers la table orders principale
  UPDATE orders o
  SET    status     = dord.status,
         updated_at = NOW()
  FROM   delivery_orders dord
  WHERE  o.id        = dord.order_id
    AND  o.status   != dord.status
    AND  dord.is_deleted = false
    AND  dord.status IN ('confirmed', 'preparing', 'ready', 'in_transit', 'delivered');

END;
$$;
