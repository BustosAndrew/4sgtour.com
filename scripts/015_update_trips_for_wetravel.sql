-- Add booking_url and continent columns to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS booking_url TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS continent TEXT;

-- Add comment
COMMENT ON COLUMN trips.booking_url IS 'WeTravel payment/booking URL for this trip';
COMMENT ON COLUMN trips.continent IS 'Continent assigned by admin for organizing trips';
