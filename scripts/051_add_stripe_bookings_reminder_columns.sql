-- Add columns to stripe_bookings needed for 5-day payment reminder SMS
-- These columns mirror what inquiries already has for custom packages

-- deposit_percentage tracks what % of total was paid as deposit
ALTER TABLE stripe_bookings 
ADD COLUMN IF NOT EXISTS deposit_percentage INTEGER DEFAULT 30;

-- remainder_due_date is when the remaining balance is due
ALTER TABLE stripe_bookings 
ADD COLUMN IF NOT EXISTS remainder_due_date DATE;

-- remainder_payment_link is the Stripe payment link for the remaining balance
ALTER TABLE stripe_bookings 
ADD COLUMN IF NOT EXISTS remainder_payment_link TEXT;

-- trip_title for display in SMS messages (avoids joining trips table)
ALTER TABLE stripe_bookings 
ADD COLUMN IF NOT EXISTS trip_title TEXT;

-- total_price for calculating remainder amount in reminders
ALTER TABLE stripe_bookings 
ADD COLUMN IF NOT EXISTS total_price NUMERIC DEFAULT 0;
