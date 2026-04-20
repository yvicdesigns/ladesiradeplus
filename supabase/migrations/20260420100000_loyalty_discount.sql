-- Add loyalty discount settings to admin_settings
ALTER TABLE admin_settings
  ADD COLUMN IF NOT EXISTS loyalty_discount_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS loyalty_discount_percent NUMERIC(5,2) DEFAULT 5;

-- Add per-item override to menu_items
-- NULL = use global setting, 0 = disabled for this item, >0 = specific % for this item
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS loyalty_discount_override NUMERIC(5,2);

-- Update existing rows with defaults
UPDATE admin_settings
SET loyalty_discount_enabled = true,
    loyalty_discount_percent = 5
WHERE loyalty_discount_enabled IS NULL;
