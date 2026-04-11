-- Add is_custom flag to trips table for privately listed custom trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_trips_is_custom ON trips(is_custom);

COMMENT ON COLUMN trips.is_custom IS 'True if this trip is a custom/private trip not shown in public listings';
