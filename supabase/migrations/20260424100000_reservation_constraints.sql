-- Prevent double-booking: same table, same date, same time, not cancelled
-- Uses a partial unique index to allow multiple cancelled reservations
CREATE UNIQUE INDEX IF NOT EXISTS reservations_no_double_booking
  ON reservations (table_id, reservation_date, reservation_time)
  WHERE status NOT IN ('cancelled', 'rejected') AND is_deleted = false AND table_id IS NOT NULL;

-- Index for fast lookup by date (common query pattern)
CREATE INDEX IF NOT EXISTS reservations_date_idx
  ON reservations (reservation_date, status)
  WHERE is_deleted = false;

-- Index for fast lookup by restaurant + date
CREATE INDEX IF NOT EXISTS reservations_restaurant_date_idx
  ON reservations (restaurant_id, reservation_date)
  WHERE is_deleted = false;
