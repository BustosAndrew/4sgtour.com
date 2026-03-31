-- Allow users to update their own messages (non-admin messages on their inquiries)
CREATE POLICY "Users can update own messages"
ON messages FOR UPDATE
TO authenticated
USING (
  sender_id = auth.uid()
  AND is_admin = false
)
WITH CHECK (
  sender_id = auth.uid()
  AND is_admin = false
);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete own messages"
ON messages FOR DELETE
TO authenticated
USING (
  sender_id = auth.uid()
  AND is_admin = false
);

-- Allow admins to update any message
CREATE POLICY "Admin can update messages"
ON messages FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  )
);

-- Allow admins to delete any message
CREATE POLICY "Admin can delete messages"
ON messages FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  )
);
