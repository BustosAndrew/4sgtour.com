-- 058: custom package payments — link bookings to their custom-package
-- inquiry, and let the admin choose how the remaining balance is collected.
--
-- Run this BEFORE deploying the code that ships with it: the new Stripe
-- webhook branch and the admin custom-booking routes write these columns, and
-- every write fails until they exist. (Independent of 056/057.)

-- 1. How the remaining balance of a custom package is collected, chosen by
--    the admin per booking:
--      'auto_charge' — save the card at deposit; the daily charge cron bills
--                      it on the remainder due date
--      'pay_link'    — the customer pays the balance from /package/[id]
--    NULL (rows created before this) behaves as 'pay_link'.
ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS balance_flow TEXT;

ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_balance_flow_check;
ALTER TABLE inquiries ADD CONSTRAINT inquiries_balance_flow_check
  CHECK (balance_flow IS NULL OR balance_flow IN ('auto_charge', 'pay_link'));

-- 2. Which custom-package inquiry a payment belongs to. /package/[id] reads
--    what has been paid from these rows, and the reminder cron links back to
--    the package page through it.
ALTER TABLE stripe_bookings
  ADD COLUMN IF NOT EXISTS inquiry_id UUID REFERENCES inquiries(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stripe_bookings_inquiry_id
  ON stripe_bookings(inquiry_id);

-- 3. 'processing': a US bank (ACH) payment Stripe has accepted but not yet
--    settled (up to ~4 business days). The webhook records it as processing
--    and only confirms it on checkout.session.async_payment_succeeded; it is
--    marked 'failed' on async_payment_failed. Same list as 056 plus
--    'processing' — safe whether or not 056 has been run.
ALTER TABLE stripe_bookings DROP CONSTRAINT IF EXISTS stripe_bookings_status_check;
ALTER TABLE stripe_bookings ADD CONSTRAINT stripe_bookings_status_check
  CHECK (status IN (
    'pending', 'processing', 'confirmed', 'completed', 'failed',
    'refunded', 'expired', 'cancelled'
  ));

-- 4. Backfill: deposits paid through the old pre-created links were written
--    by the webhook with the inquiry's Stripe session id. Link those rows so
--    their package pages show them as paid.
UPDATE stripe_bookings b
SET inquiry_id = i.id
FROM inquiries i
WHERE b.inquiry_id IS NULL
  AND i.is_custom_package = true
  AND i.stripe_session_id IS NOT NULL
  AND b.stripe_checkout_session_id = i.stripe_session_id;
