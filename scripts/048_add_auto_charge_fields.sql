-- Add fields to stripe_bookings for automatic remaining balance charging
-- These fields track when and how to charge the remaining balance

-- Add trip start date (extracted from booking_details for easier querying)
ALTER TABLE stripe_bookings 
ADD COLUMN IF NOT EXISTS trip_start_date DATE;

-- Add the total package price (full price, not just deposit)
-- Note: total_package_price already exists, but let's ensure it's used properly

-- Add remaining balance to be charged
ALTER TABLE stripe_bookings 
ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC DEFAULT 0;

-- Add the date when auto-charge should occur (30 or 60 days before trip)
ALTER TABLE stripe_bookings 
ADD COLUMN IF NOT EXISTS auto_charge_date DATE;

-- Add Stripe customer ID for off-session payments
ALTER TABLE stripe_bookings 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add Stripe payment method ID for off-session payments
ALTER TABLE stripe_bookings 
ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT;

-- Track if the remaining balance has been charged
ALTER TABLE stripe_bookings 
ADD COLUMN IF NOT EXISTS remaining_balance_charged BOOLEAN DEFAULT FALSE;

-- Track when the remaining balance was charged
ALTER TABLE stripe_bookings 
ADD COLUMN IF NOT EXISTS remaining_balance_charged_at TIMESTAMP WITH TIME ZONE;

-- Track the payment intent for the remaining balance charge
ALTER TABLE stripe_bookings 
ADD COLUMN IF NOT EXISTS remaining_balance_payment_intent_id TEXT;

-- Create index for efficient querying of pending auto-charges
CREATE INDEX IF NOT EXISTS idx_stripe_bookings_auto_charge 
ON stripe_bookings (auto_charge_date, remaining_balance_charged, status)
WHERE remaining_balance_charged = FALSE AND status = 'confirmed';

-- Add comment explaining the auto-charge logic
COMMENT ON COLUMN stripe_bookings.auto_charge_date IS 
'Date when remaining balance will be automatically charged. 
If trip is less than 60 days away at booking: charge 30 days before trip.
If trip is more than 60 days away at booking: charge 60 days before trip.';
