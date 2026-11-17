-- 059: tournament ticket requests are saved; customers can only see their
-- own inquiries/messages, matched on a CONFIRMED sign-in email; customers
-- can't post messages as the team.
--
-- Requires 056 (public.current_user_confirmed_email()). Run BEFORE deploying
-- the code that ships with it: the tournament ticket route writes
-- inquiries.tournament_event_id.

-- 1. Tournament ticket requests. They used to put the tournament *event* id
--    in inquiries.trip_id, which references trips(id) — so every insert
--    failed and requests only ever existed as an admin email.
ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS tournament_event_id UUID
    REFERENCES tournament_events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inquiries_tournament_event_id
  ON inquiries(tournament_event_id);

-- 2. Customer policies matched on profiles.email — which a user can change
--    themselves (profiles_update_own). Setting it to another customer's
--    address exposed that customer's inquiries and message threads. Match on
--    the email Supabase Auth has confirmed instead (same as 056 does for
--    stripe_bookings). Case-insensitive: guests type their email any way.
DROP POLICY IF EXISTS "Users can view own inquiries" ON inquiries;
CREATE POLICY "Users can view own inquiries" ON inquiries
  FOR SELECT TO authenticated
  USING (lower(customer_email) = (SELECT public.current_user_confirmed_email()));

DROP POLICY IF EXISTS "Users can view own inquiry messages" ON messages;
CREATE POLICY "Users can view own inquiry messages" ON messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inquiries
      WHERE inquiries.id = messages.inquiry_id
        AND lower(inquiries.customer_email) = (SELECT public.current_user_confirmed_email())
    )
  );

-- 3. Customers may post only as themselves and never with is_admin = true
--    (the API used to take is_admin from the browser). Admins keep their own
--    "Admin can insert messages" policy.
DROP POLICY IF EXISTS "Users can send messages for own inquiries" ON messages;
CREATE POLICY "Users can send messages for own inquiries" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin = false
    AND sender_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM inquiries
      WHERE inquiries.id = inquiry_id
        AND lower(inquiries.customer_email) = (SELECT public.current_user_confirmed_email())
    )
  );

-- 4. Declined remaining-balance charges: the charge cron retries a decline on
--    the next daily runs, up to 3 attempts, then stops auto-charging that
--    booking and tells the admin and the customer (it used to retry — and
--    email the admin — every day, indefinitely).
ALTER TABLE stripe_bookings
  ADD COLUMN IF NOT EXISTS charge_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_charge_error TEXT;
