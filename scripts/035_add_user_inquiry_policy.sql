-- Add policy to allow users to view their own inquiries by email
CREATE POLICY "Users can view own inquiries"
ON inquiries FOR SELECT
TO authenticated
USING (
  customer_email = (
    SELECT email FROM profiles
    WHERE profiles.id = auth.uid()
  )
);
