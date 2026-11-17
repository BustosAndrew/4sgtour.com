-- 060: customers cancel their own bookings under the cancellation policy;
-- admins approve and issue the refund.
--
-- Run BEFORE deploying the code that ships with it: My Bookings reads
-- trips.cancellation_schedule and the new stripe_bookings columns, and the
-- trip forms write cancellation_schedule. Safe to run more than once.

-- 1. Which fee schedule a trip uses (Terms → Cancellation Policy).
--    'standard'   — HQ / Los Angeles: 50% / 60% / 80% / 100%
--    'western_us' — LA branch Western US tour: 20% / 50% / 80% / 100%
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS cancellation_schedule TEXT NOT NULL DEFAULT 'standard';

ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_cancellation_schedule_check;
ALTER TABLE trips ADD CONSTRAINT trips_cancellation_schedule_check
  CHECK (cancellation_schedule IN ('standard', 'western_us'));

-- 2. The cancellation, frozen when it happens. The fee depends on the day
--    the customer cancelled, not the day the admin gets round to refunding,
--    so it is recorded here rather than recomputed later.
--    cancellation_paid_amount: paid toward the trip price at cancellation
--      (excludes card processing fees). Read before the row is cancelled —
--      cancelling sets remaining_balance_charged to stop the balance cron.
--    cancellation_refund_due: paid − fee, floored at 0, before the 8% card
--      refund fee (which depends on the refund date, so is applied then).
ALTER TABLE stripe_bookings
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_schedule TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_fee_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS cancellation_fee NUMERIC,
  ADD COLUMN IF NOT EXISTS cancellation_paid_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS cancellation_refund_due NUMERIC,
  -- 3. The refund the admin approved (0 = closed with no refund).
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_refund_ids TEXT[];

ALTER TABLE stripe_bookings DROP CONSTRAINT IF EXISTS stripe_bookings_cancelled_by_check;
ALTER TABLE stripe_bookings ADD CONSTRAINT stripe_bookings_cancelled_by_check
  CHECK (cancelled_by IS NULL OR cancelled_by IN ('customer', 'admin'));

-- Admin → Inquiries looks for cancellations still waiting on a refund.
CREATE INDEX IF NOT EXISTS idx_stripe_bookings_refund_pending
  ON stripe_bookings(cancelled_at)
  WHERE cancelled_at IS NOT NULL AND refunded_at IS NULL;

-- No RLS changes: customers still only SELECT their own rows. Cancelling
-- and refunding go through server routes that check ownership / the admin
-- role and then write with the service-role client.
