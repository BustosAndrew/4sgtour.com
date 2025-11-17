-- Create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  trip_title TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  package_name TEXT,
  start_date DATE,
  end_date DATE,
  add_ons TEXT[], -- Array of add-on names
  rounds INTEGER DEFAULT 0,
  additional_requests TEXT,
  total_price NUMERIC(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, contacted, converted, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_inquiries_trip_id ON inquiries(trip_id);
CREATE INDEX idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX idx_inquiries_status ON inquiries(status);

-- Enable RLS
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Admin can view all inquiries
CREATE POLICY "Admin can view all inquiries"
ON inquiries FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  )
);

-- Admin can update inquiries
CREATE POLICY "Admin can update inquiries"
ON inquiries FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  )
);

-- Allow insert from API (server-side)
CREATE POLICY "Allow inquiry creation"
ON inquiries FOR INSERT
WITH CHECK (true);
