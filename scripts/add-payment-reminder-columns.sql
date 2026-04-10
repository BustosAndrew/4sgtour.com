-- Add payment reminder tracking columns to inquiries and stripe_bookings tables
-- This allows tracking when 5-day payment reminders have been sent

-- Add to inquiries table (for custom packages)
ALTER TABLE inquiries 
ADD COLUMN IF NOT EXISTS payment_reminder_sent_at timestamp with time zone;

-- Add to stripe_bookings table (for regular trip bookings)
ALTER TABLE stripe_bookings 
ADD COLUMN IF NOT EXISTS payment_reminder_sent_at timestamp with time zone;

COMMENT ON COLUMN inquiries.payment_reminder_sent_at IS 'Timestamp when the 5-day payment reminder was sent to the customer';
COMMENT ON COLUMN stripe_bookings.payment_reminder_sent_at IS 'Timestamp when the 5-day payment reminder was sent to the customer';
