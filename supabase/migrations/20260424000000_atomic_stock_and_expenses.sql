-- ============================================================
-- Migration: Atomic stock deduction RPCs + expenses table
-- ============================================================

-- 1. ATOMIC ingredient stock deduction (prevents race conditions)
CREATE OR REPLACE FUNCTION deduct_ingredient_stock(p_id UUID, p_qty NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_stock NUMERIC;
BEGIN
  UPDATE ingredients
  SET current_stock = GREATEST(0, current_stock - p_qty),
      updated_at = NOW()
  WHERE id = p_id
  RETURNING current_stock INTO v_new_stock;
  RETURN v_new_stock;
END;
$$;

-- 2. ATOMIC ingredient stock restoration (on cancellation)
CREATE OR REPLACE FUNCTION restore_ingredient_stock(p_id UUID, p_qty NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_stock NUMERIC;
BEGIN
  UPDATE ingredients
  SET current_stock = current_stock + p_qty,
      updated_at = NOW()
  WHERE id = p_id
  RETURNING current_stock INTO v_new_stock;
  RETURN v_new_stock;
END;
$$;

-- 3. ATOMIC menu item stock deduction
CREATE OR REPLACE FUNCTION deduct_menu_item_stock(p_id UUID, p_qty INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_stock INTEGER;
BEGIN
  UPDATE menu_items
  SET stock_quantity = GREATEST(0, stock_quantity - p_qty)
  WHERE id = p_id AND stock_quantity IS NOT NULL
  RETURNING stock_quantity INTO v_new_stock;
  RETURN v_new_stock;
END;
$$;

-- 4. ATOMIC menu item stock restoration
CREATE OR REPLACE FUNCTION restore_menu_item_stock(p_id UUID, p_qty INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_stock INTEGER;
BEGIN
  UPDATE menu_items
  SET stock_quantity = stock_quantity + p_qty
  WHERE id = p_id AND stock_quantity IS NOT NULL
  RETURNING stock_quantity INTO v_new_stock;
  RETURN v_new_stock;
END;
$$;

-- 5. expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL DEFAULT '7eedf081-0268-4867-af38-61fa5932420a',
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin/manager can manage expenses" ON expenses;
CREATE POLICY "Admin/manager can manage expenses" ON expenses
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.role IN ('admin', 'manager')
    )
  );

CREATE INDEX IF NOT EXISTS expenses_restaurant_date_idx
  ON expenses (restaurant_id, expense_date);
