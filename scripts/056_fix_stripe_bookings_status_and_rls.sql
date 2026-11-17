-- 056: stripe_bookings — let the webhook confirm bookings, and stop exposing
-- every booking to the public anon key.
--
-- Run AFTER the code change that drops `.select().single()` from the pending-
-- booking insert in app/actions/stripe.ts is deployed on ALL THREE sites.
-- Dropping the public SELECT policy before that ships makes the guest-checkout
-- insert fail its read-back.
--
-- Diagnose first (read-only) — shows the constraints actually in force, which
-- may differ from the scripts because some were edited by hand:
--
--   SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--   WHERE conrelid = 'public.stripe_bookings'::regclass AND contype = 'c';
--
--   SELECT policyname, roles, cmd, qual
--   FROM pg_policies WHERE tablename = 'stripe_bookings';

-- 1. Status values the code actually writes.
--    001 only allowed ('pending','completed','failed','refunded'), but the
--    webhook writes 'confirmed', checkout.session.expired writes 'expired',
--    and trip deletion writes 'cancelled'. With the old constraint the
--    webhook's UPDATE to 'confirmed' fails, so no booking ever leaves
--    'pending', its payment intent / customer / payment method are never
--    saved, and the remaining-balance cron (which selects status='confirmed'
--    with a saved customer) can never charge anyone.
ALTER TABLE stripe_bookings DROP CONSTRAINT IF EXISTS stripe_bookings_status_check;
ALTER TABLE stripe_bookings ADD CONSTRAINT stripe_bookings_status_check
  CHECK (status IN (
    'pending', 'confirmed', 'completed', 'failed',
    'refunded', 'expired', 'cancelled'
  ));

-- 2. Payment methods the code actually writes ('sms_link' was missing from 004).
ALTER TABLE stripe_bookings DROP CONSTRAINT IF EXISTS stripe_bookings_payment_method_check;
ALTER TABLE stripe_bookings ADD CONSTRAINT stripe_bookings_payment_method_check
  CHECK (payment_method IN (
    'card', 'ach', 'credit_card', 'bank_transfer', 'us_bank_account', 'sms_link'
  ));

-- 3. Remove the public read policy from 002. `USING (true)` for role `public`
--    let anyone holding the anon key (it ships in every page's JS) read every
--    booking: names, emails, phones, Stripe customer ids, trip dates.
--    Remaining read access: admins ("Admin can view all stripe bookings") and
--    signed-in users for their own rows ("Users can view own stripe bookings").
--    The webhook and cron jobs use the service role and are unaffected.
DROP POLICY IF EXISTS "Anyone can view stripe bookings by session" ON stripe_bookings;

-- 4. Let a signed-in customer see bookings they made as a guest under the
--    same email (the /bookings page lists them). "Users can view own stripe
--    bookings" only covers rows whose user_id is theirs.
--
--    Matches the email Supabase Auth has CONFIRMED — not profiles.email,
--    which users can edit themselves (profiles_update_own), and not an
--    unconfirmed sign-up, either of which would let someone read a stranger's
--    booking by claiming their address.
CREATE OR REPLACE FUNCTION public.current_user_confirmed_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT lower(u.email)
  FROM auth.users u
  WHERE u.id = auth.uid()
    AND u.email_confirmed_at IS NOT NULL
$$;

REVOKE ALL ON FUNCTION public.current_user_confirmed_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_confirmed_email() TO authenticated;

DROP POLICY IF EXISTS "Users can view stripe bookings by confirmed email" ON stripe_bookings;
CREATE POLICY "Users can view stripe bookings by confirmed email"
  ON stripe_bookings
  FOR SELECT
  TO authenticated
  USING (lower(customer_email) = (SELECT public.current_user_confirmed_email()));
