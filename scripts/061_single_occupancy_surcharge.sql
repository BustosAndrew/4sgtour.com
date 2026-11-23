-- 061: the single-room surcharge becomes a per-trip setting.
--
-- It used to be a fixed 12% in code (lib/booking-price.ts). Admins now set it
-- on each trip's create / edit form: a percentage of the per-person price,
-- added for every traveler (the booker and each guest) who picks a single
-- room. 0 means no surcharge. Existing trips keep 12%.
--
-- Run BEFORE deploying the code that ships with it: the booking form, the
-- checkout price check (lib/resolve-booking-price.ts) and the trip forms
-- read and write this column, so without it every checkout fails.
-- Safe to run more than once.

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS single_occupancy_surcharge NUMERIC(5, 2) NOT NULL DEFAULT 12;

ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_single_occupancy_surcharge_check;
ALTER TABLE trips ADD CONSTRAINT trips_single_occupancy_surcharge_check
  CHECK (single_occupancy_surcharge >= 0 AND single_occupancy_surcharge <= 100);

COMMENT ON COLUMN trips.single_occupancy_surcharge IS
  'Percent of the per-person price added for each traveler in a single room. Migration 061.';
