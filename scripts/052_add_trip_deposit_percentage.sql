-- Add deposit_percentage column to trips table
-- This allows configuring the deposit percentage for each trip
-- If NULL, defaults to 30% (the previous hardcoded value)
ALTER TABLE trips ADD COLUMN IF NOT EXISTS deposit_percentage INTEGER DEFAULT 30;

-- Add a comment to explain the column
COMMENT ON COLUMN trips.deposit_percentage IS 'The deposit percentage required for booking this trip. Customers can choose to pay this or 100% at checkout.';
