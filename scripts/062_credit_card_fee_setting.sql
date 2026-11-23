-- 062: the credit card processing fee becomes an admin setting.
--
-- It used to be a fixed 4% in code (lib/booking-price.ts). Admins now set:
--   - a default, in app_settings ('credit_card_fee_percent'), from
--     Admin → Payments. New trips start with it, and the admin can apply it
--     to every existing trip at once;
--   - each trip's own, trips.credit_card_fee_percent, on the trip and
--     custom-package create / edit forms.
-- 0 means no fee. Existing trips keep 4%. The fee applies to credit cards
-- only (debit and prepaid cards are refunded it), whatever the percentage.
--
-- Run BEFORE deploying the code that ships with it: the checkout price check
-- (lib/resolve-booking-price.ts), the payment pages and the trip forms read
-- and write these, so without them every checkout fails.
-- Safe to run more than once.

-- ── Site-wide settings ───────────────────────────────────────────────────
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.app_settings enable row level security;

-- Readable by anyone (the values are not secret: a fee shown on every
-- payment page). Written by admins only.
drop policy if exists "Anyone can read app settings" on public.app_settings;
create policy "Anyone can read app settings" on public.app_settings
  for select
  using (true);

drop policy if exists "Admins can create app settings" on public.app_settings;
create policy "Admins can create app settings" on public.app_settings
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.user_type = 'admin'
    )
  );

drop policy if exists "Admins can update app settings" on public.app_settings;
create policy "Admins can update app settings" on public.app_settings
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.user_type = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.user_type = 'admin'
    )
  );

insert into public.app_settings (key, value)
values ('credit_card_fee_percent', '4'::jsonb)
on conflict (key) do nothing;

comment on table public.app_settings is
  'Site-wide admin settings, one row per key. Migration 062.';

-- ── Each trip's fee ──────────────────────────────────────────────────────
alter table public.trips
  add column if not exists credit_card_fee_percent numeric(5, 2) not null default 4;

alter table public.trips drop constraint if exists trips_credit_card_fee_percent_check;
alter table public.trips add constraint trips_credit_card_fee_percent_check
  check (credit_card_fee_percent >= 0 and credit_card_fee_percent <= 10);

comment on column public.trips.credit_card_fee_percent is
  'Percent added to credit card payments for this trip (0 = none). Debit and prepaid cards never pay it. Migration 062.';
