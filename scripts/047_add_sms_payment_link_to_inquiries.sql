-- Add SMS payment link support to inquiries table
ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS payment_link TEXT,
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_link_sent_at TIMESTAMPTZ;

-- Index for looking up inquiries by stripe session (used in webhook)
CREATE INDEX IF NOT EXISTS idx_inquiries_stripe_session_id ON inquiries(stripe_session_id);

-- Allow authenticated users to view their own inquiries by email
DROP POLICY IF EXISTS "Users can view own inquiries" ON inquiries;
CREATE POLICY "Users can view own inquiries"
ON inquiries FOR SELECT
TO authenticated
USING (
  customer_email = (
    SELECT email FROM profiles WHERE profiles.id = auth.uid()
  )
);

-- Update stripe_bookings payment_method constraint to allow 'sms_link'
ALTER TABLE stripe_bookings DROP CONSTRAINT IF EXISTS stripe_bookings_payment_method_check;
ALTER TABLE stripe_bookings ADD CONSTRAINT stripe_bookings_payment_method_check
  CHECK (payment_method IN ('card', 'ach', 'credit_card', 'bank_transfer', 'sms_link'));
