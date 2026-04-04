-- Comprehensive Database Migration Script (Run Automatically by Action)
DO $$
DECLARE
    SINGLE_RESTAURANT_ID uuid := 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';
    t text;
    target_tables text[] := ARRAY[
        'menu_items', 'menu_categories', 'orders', 'delivery_orders', 
        'restaurant_orders', 'reservations', 'tables', 'reviews', 
        'customers', 'admin_settings', 'admin_users', 'delivery_zones', 
        'promo_banners', 'promo_codes', 'promotions', 'special_offers', 'banners'
    ];
BEGIN
    FOREACH t IN ARRAY target_tables
    LOOP
        EXECUTE format('UPDATE public.%I SET restaurant_id = %L WHERE restaurant_id IS NULL OR restaurant_id != %L;', t, SINGLE_RESTAURANT_ID, SINGLE_RESTAURANT_ID);
    END LOOP;
END $$;