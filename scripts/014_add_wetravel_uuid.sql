-- Add WeTravel UUID column to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS wetravel_uuid TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trips_wetravel_uuid ON trips(wetravel_uuid);

-- Add comment
COMMENT ON COLUMN trips.wetravel_uuid IS 'UUID from WeTravel API for syncing';
