-- Per-key permission to read custom trips through /api/v1/trips/latest.
--
-- A custom trip (`trips.is_custom = true`) is built by the admin
-- custom-booking flow for one named customer and is hidden from every public
-- listing, so it must not be readable by default. The partner endpoint takes
-- an `include_custom=true` parameter, but honours it only for keys that carry
-- this flag — otherwise the choice to expose private bookings would sit with
-- the partner rather than with 4SG Tour.
--
-- Defaults to false, so every key issued before this migration keeps behaving
-- exactly as it did.

alter table public.api_keys
  add column if not exists allow_custom_trips boolean not null default false;

comment on column public.api_keys.allow_custom_trips is
  'When true, this key may pass include_custom=true to /api/v1/trips/latest and receive custom (private, per-customer) trips. Defaults to false; granted per partner by an admin.';
