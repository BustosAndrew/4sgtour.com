-- Fix the payment_method check constraint to allow 'card' and 'ach' values
-- Drop the existing constraint
ALTER TABLE stripe_bookings DROP CONSTRAINT IF EXISTS stripe_bookings_payment_method_check;

-- Add a new constraint that allows 'card', 'ach', 'credit_card', and 'bank_transfer'
ALTER TABLE stripe_bookings ADD CONSTRAINT stripe_bookings_payment_method_check 
  CHECK (payment_method IN ('card', 'ach', 'credit_card', 'bank_transfer'));
