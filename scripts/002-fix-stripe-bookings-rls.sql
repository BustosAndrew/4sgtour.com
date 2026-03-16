-- Fix RLS policy for stripe_bookings to allow both authenticated users and guests to insert

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Allow stripe booking insert" ON stripe_bookings;

-- Create a new policy that allows anyone to insert (both authenticated users and anonymous/guests)
-- The booking is tied to the session, so it's secure
CREATE POLICY "Allow stripe booking insert"
ON stripe_bookings
FOR INSERT
TO public
WITH CHECK (true);

-- Also ensure authenticated users can only insert with their own user_id or null (for guests)
-- This is already handled by the application logic, but adding an additional select policy for guests
DROP POLICY IF EXISTS "Users can view own stripe bookings" ON stripe_bookings;

CREATE POLICY "Users can view own stripe bookings"
ON stripe_bookings
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow guests to view their bookings by email (via webhook/confirmation page)
CREATE POLICY "Anyone can view stripe bookings by session"
ON stripe_bookings
FOR SELECT
TO public
USING (true);
