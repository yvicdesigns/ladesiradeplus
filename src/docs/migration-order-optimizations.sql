/*
  MIGRATION: Order Optimizations
  DESCRIPTION: Creates an atomic RPC function for order creation and adds performance indexes for history queries.
  RUN IN: Supabase SQL Editor
*/

-- 1. Create Atomic Order Insertion RPC
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_order_data JSONB,
  p_items_data JSONB,
  p_delivery_data JSONB DEFAULT NULL,
  p_restaurant_data JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_result JSONB;
BEGIN
  -- Insert into orders table
  INSERT INTO orders (
    user_id, restaurant_id, customer_name, customer_phone, customer_email,
    delivery_address, type, order_type, order_method, table_id, total,
    product_discount_total, promo_code_discount_total, promo_code_id,
    discount_breakdown, status, created_at
  ) VALUES (
    (p_order_data->>'user_id')::UUID,
    (p_order_data->>'restaurant_id')::UUID,
    p_order_data->>'customer_name',
    p_order_data->>'customer_phone',
    p_order_data->>'customer_email',
    p_order_data->>'delivery_address',
    p_order_data->>'type',
    p_order_data->>'order_type',
    p_order_data->>'order_method',
    NULLIF(p_order_data->>'table_id', '')::UUID,
    (p_order_data->>'total')::NUMERIC,
    (p_order_data->>'product_discount_total')::NUMERIC,
    (p_order_data->>'promo_code_discount_total')::NUMERIC,
    NULLIF(p_order_data->>'promo_code_id', '')::UUID,
    p_order_data->'discount_breakdown',
    COALESCE(p_order_data->>'status', 'pending'),
    COALESCE((p_order_data->>'created_at')::TIMESTAMPTZ, NOW())
  ) RETURNING id INTO v_order_id;

  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items_data)
  LOOP
    INSERT INTO order_items (
      order_id, menu_item_id, quantity, price, notes, status
    ) VALUES (
      v_order_id,
      (v_item->>'menu_item_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price')::NUMERIC,
      v_item->>'notes',
      COALESCE(v_item->>'status', 'pending')
    );
  END LOOP;

  -- Insert into specific tables if requested
  IF p_delivery_data IS NOT NULL THEN
    INSERT INTO delivery_orders (
      order_id, restaurant_id, customer_id, status, payment_status, payment_method,
      mobile_money_type, payment_screenshot_url, delivery_fee, estimated_delivery_time_text,
      distance_km, calculated_delivery_fee, quarter_name
    ) VALUES (
      v_order_id,
      (p_delivery_data->>'restaurant_id')::UUID,
      (p_delivery_data->>'customer_id')::UUID,
      COALESCE(p_delivery_data->>'status', 'pending'),
      COALESCE(p_delivery_data->>'payment_status', 'pending'),
      p_delivery_data->>'payment_method',
      p_delivery_data->>'mobile_money_type',
      p_delivery_data->>'payment_screenshot_url',
      (p_delivery_data->>'delivery_fee')::NUMERIC,
      p_delivery_data->>'estimated_delivery_time_text',
      (p_delivery_data->>'distance_km')::NUMERIC,
      (p_delivery_data->>'calculated_delivery_fee')::NUMERIC,
      p_delivery_data->>'quarter_name'
    );
  END IF;

  IF p_restaurant_data IS NOT NULL THEN
    INSERT INTO restaurant_orders (
      order_id, restaurant_id, customer_id, status, payment_status, payment_method,
      mobile_money_type, payment_screenshot_url
    ) VALUES (
      v_order_id,
      (p_restaurant_data->>'restaurant_id')::UUID,
      (p_restaurant_data->>'customer_id')::UUID,
      COALESCE(p_restaurant_data->>'status', 'pending'),
      COALESCE(p_restaurant_data->>'payment_status', 'unpaid'),
      p_restaurant_data->>'payment_method',
      p_restaurant_data->>'mobile_money_type',
      p_restaurant_data->>'payment_screenshot_url'
    );
  END IF;

  v_result := jsonb_build_object('order_id', v_order_id, 'success', true);
  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Transaction rolls back automatically on exception in Postgres functions
  RAISE EXCEPTION 'Atomic order creation failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 2. Performance Indexes for Order History
CREATE INDEX IF NOT EXISTS idx_orders_user_created_desc 
ON orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created_desc 
ON orders (restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_deleted 
ON orders (is_deleted);