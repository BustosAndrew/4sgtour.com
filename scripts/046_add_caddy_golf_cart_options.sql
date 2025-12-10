-- Migration: Create trip_service_options table for Caddy / Golf Cart and similar extras
-- These options are per-trip flags (e.g., Caddy, Golf Cart) that can be
-- marked as included or not, similar to meal and transportation options.

CREATE TABLE IF NOT EXISTS trip_service_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_included BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookup by trip
CREATE INDEX IF NOT EXISTS idx_service_options_trip_id
  ON trip_service_options(trip_id);

-- Enable Row Level Security
ALTER TABLE trip_service_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies: publicly readable, admin-only write access
CREATE POLICY "Service options are viewable by everyone" ON trip_service_options
  FOR SELECT USING (true);

CREATE POLICY "Service options are insertable by admins" ON trip_service_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Service options are updatable by admins" ON trip_service_options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Service options are deletable by admins" ON trip_service_options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Usage notes:
-- - Store rows with name = 'Caddy' and name = 'Golf Cart' per trip.
-- - The create/edit trip forms can surface these as toggles bound to
--   is_included, similar to meal/transportation options.
