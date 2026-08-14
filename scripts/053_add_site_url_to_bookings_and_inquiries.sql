-- Record which of the three sites a booking or inquiry originated from.
--
-- 4sgtour.com, 4sgtour.de and 4sgtour.at are separate deployments sharing this
-- one database. The daily cron jobs run only on the .com deployment (running
-- them from all three would charge each customer up to three times), so
-- without this column every reminder and balance-charge email is sent from
-- noreply@4sgtour.com with 4sgtour.com links — including to customers who
-- booked on the German or Austrian site.
--
-- Left nullable on purpose: rows created before this migration have no
-- recoverable origin, and the application falls back to the deployment's own
-- NEXT_PUBLIC_SITE_URL, which reproduces today's behaviour exactly.

alter table public.stripe_bookings
  add column if not exists site_url text;

alter table public.inquiries
  add column if not exists site_url text;

comment on column public.stripe_bookings.site_url is
  'Origin site of the booking, e.g. https://4sgtour.de. Null for rows created before migration 053; consumers fall back to the running deployment''s own URL.';

comment on column public.inquiries.site_url is
  'Origin site of the inquiry, e.g. https://4sgtour.de. Null for rows created before migration 053; consumers fall back to the running deployment''s own URL.';

-- The cron jobs filter on due date + "not yet sent/charged" and then read
-- site_url per row; no index is needed for the column itself.
