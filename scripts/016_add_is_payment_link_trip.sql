-- Add field to track trips created from payment links
-- These trips should not show up on admin page or destinations

ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_payment_link_trip BOOLEAN DEFAULT false;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_trips_is_payment_link_trip ON trips(is_payment_link_trip);

COMMENT ON COLUMN trips.is_payment_link_trip IS 'True if this trip was created from a dynamic payment link (not a full WeTravel trip)';
