-- Add Stripe columns to packages table
ALTER TABLE packages 
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Add Stripe payment enabled flag to trips table
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS stripe_payment_enabled BOOLEAN DEFAULT FALSE;

-- Create stripe_bookings table
CREATE TABLE IF NOT EXISTS stripe_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  payment_method TEXT CHECK (payment_method IN ('card', 'us_bank_account')),
  deposit_amount NUMERIC NOT NULL,
  processing_fee NUMERIC DEFAULT 0,
  total_paid NUMERIC NOT NULL,
  total_package_price NUMERIC NOT NULL,
  booking_details JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stripe_bookings_trip_id ON stripe_bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_stripe_bookings_user_id ON stripe_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_bookings_session_id ON stripe_bookings(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_stripe_bookings_status ON stripe_bookings(status);

-- Enable RLS on stripe_bookings
ALTER TABLE stripe_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stripe_bookings
-- Admin can view all bookings
CREATE POLICY "Admin can view all stripe bookings" ON stripe_bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'admin'
    )
  );

-- Admin can update all bookings
CREATE POLICY "Admin can update stripe bookings" ON stripe_bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'admin'
    )
  );

-- Users can view their own bookings
CREATE POLICY "Users can view own stripe bookings" ON stripe_bookings
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow insert for anyone (needed for guest bookings via webhook)
CREATE POLICY "Allow stripe booking insert" ON stripe_bookings
  FOR INSERT
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stripe_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_stripe_bookings_updated_at ON stripe_bookings;
CREATE TRIGGER trigger_stripe_bookings_updated_at
  BEFORE UPDATE ON stripe_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_stripe_bookings_updated_at();
