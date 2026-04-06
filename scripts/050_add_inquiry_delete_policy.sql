-- Add DELETE policy for inquiries table so admins can delete inquiries
CREATE POLICY "Admin can delete inquiries" ON public.inquiries
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );
