-- Create messages table for admin-user communication
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_inquiry_id ON messages(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Admin can view all messages
CREATE POLICY "Admin can view all messages"
ON messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  )
);

-- Admin can insert messages
CREATE POLICY "Admin can insert messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  )
);

-- Users can view messages for their own inquiries
CREATE POLICY "Users can view own inquiry messages"
ON messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM inquiries
    WHERE inquiries.id = messages.inquiry_id
    AND inquiries.customer_email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Users can send messages for their own inquiries
CREATE POLICY "Users can send messages for own inquiries"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM inquiries
    WHERE inquiries.id = inquiry_id
    AND inquiries.customer_email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Allow anonymous message insertion (for inquiry form)
CREATE POLICY "Allow inquiry message creation"
ON messages FOR INSERT
WITH CHECK (true);
