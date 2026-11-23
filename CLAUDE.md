# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**4sgtour.com** — a golf trip booking platform (4 Seasons Golf Tour). Public site for browsing
destinations, trips, and tournament events; Stripe checkout for bookings; a protected admin
dashboard for managing trips, tournaments, inquiries, and messages. Originally scaffolded with
v0.app, deployed on Vercel at https://4sgtour.com.

> **This repo has two siblings.** The same product also ships as `4sgtour-de` and `4sgtour-at`
> (both at `~/Documents/GitHub/`). After finishing a change here, **ask** whether it should also be
> applied to them — never propagate on your own. See
> [Sister sites](#sister-sites-4sgtourde--4sgtourat--three-repos-one-product).

## Commands

```powershell
pnpm install      # install deps (pnpm — a pnpm-lock.yaml is committed)
pnpm dev          # dev server on :3000
pnpm build        # production build — this is the real correctness gate
pnpm start        # serve a production build
npx tsc --noEmit  # type check only (faster than a full build)
```

`pnpm lint` is declared in package.json but **does not work**: eslint is not a dependency and
there is no `eslint.config.*`. Use `pnpm build` or `npx tsc --noEmit` to check work instead.
There are no automated tests.

## Stack

- Next.js 16 App Router, React 19, TypeScript strict
- Supabase (Postgres + Auth + RLS) via `@supabase/ssr`
- Tailwind CSS v4 (`@tailwindcss/postcss`, no tailwind.config — theme lives in `app/globals.css`)
- shadcn/ui (new-york style) over Radix primitives in `components/ui/`
- Stripe (checkout, webhooks, auto-charge), Resend (email), Twilio (SMS payment links)
- Vercel Blob (image uploads), Vercel Analytics, Vercel Cron
- AI SDK v6 (`ai`) through the Vercel AI Gateway for content translation
- Path alias: `@/*` → project root

## Architecture

### Server vs Client components

Default to Server Components. Add `"use client"` only for interactivity, browser APIs, or
Radix wrappers. Server Components query Supabase directly — there is no data-fetching layer
between pages and the database.

### Two Supabase clients — never mix them

```typescript
// Server Components, Route Handlers, Server Actions
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()   // async, cookie-bound

// Client Components only
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()          // browser singleton
```

The exceptions use a **service-role** client that bypasses RLS: the cron routes and the Stripe
webhook (built directly with `@supabase/supabase-js`), and the custom-package page and its
checkout route (`createServiceClient()` from [lib/supabase/service.ts](lib/supabase/service.ts)) —
see [Custom packages](#custom-packages).

### Auth & authorization

- `proxy.ts` (Next.js 16's middleware entry point, **not** `middleware.ts`) calls
  `updateSession()` from [lib/supabase/middleware.ts](lib/supabase/middleware.ts) and seeds the
  `NEXT_LOCALE` cookie.
- Middleware redirects anonymous users away from `/admin`, `/bookings`, `/dashboard`, and
  redirects signed-in users away from `/auth/login` and `/auth/sign-up`.
- OAuth and password-recovery links both land on `/auth/callback`, which exchanges the code for a
  session and then forwards to the `redirect` query param. Password reset therefore points at
  `/auth/callback?redirect=/auth/update-password`, **not** straight at `/auth/update-password` —
  sent directly, that page would load with no session and no way to set a password.
- Callback origins are derived from the request (`requestUrl.origin`, `window.location.origin`),
  so no per-site code is needed — but every origin must be in the Supabase project's **Redirect
  URLs** allow-list (Authentication → URL Configuration). All three sites share one Supabase
  project whose Site URL is `https://4sgtour.com`; an origin missing from the allow-list silently
  falls back to that, dropping `.de`/`.at` users on the wrong site mid-login.
- Middleware only checks *authentication*. Every admin page and `/api/admin/*` route must
  re-check the role server-side:

```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/auth/login')
const userType = await getUserType()      // '@/lib/supabase/get-user-type'
if (userType !== 'admin') redirect('/')
```

Rules that follow from incidents found on 2026-11-16:

- **Customer RLS matches the confirmed sign-in email**, via `public.current_user_confirmed_email()`
  (migration `056`), never `profiles.email` — users can edit their own profile row, so matching
  on it let anyone read another customer's inquiries, messages and bookings (`056`, `059`).
- **Never take a role or privilege from the request body.** The messages API decides `is_admin`
  with `getUserType()`; the RLS insert policy also forbids customers setting it.
- **Escape visitor text in HTML emails** with `escapeHtml()` from
  [lib/escape-html.ts](lib/escape-html.ts).
- **Routes that cost money are admin-only**: `/api/translate`, `/api/translate/batch` (AI
  Gateway) and `/api/upload` (Blob storage).
- **Cron routes fail closed**: no `CRON_SECRET` → 401, never "run for anyone".

### Internationalization

Locales are `en | ko | de` ([lib/i18n/config.ts](lib/i18n/config.ts)), selected by the
`NEXT_LOCALE` cookie — **there are no `/[locale]` route segments**.

- UI strings: `messages/{en,ko,de}.json`, namespaced (`hero`, `nav`, `trips`, `checkout`, …).
  Server: `getServerTranslations(namespace)` from [lib/i18n/server.ts](lib/i18n/server.ts).
  Client: the `I18nProvider` in [lib/i18n/provider.tsx](lib/i18n/provider.tsx).
  All three message files must stay key-compatible.
- Database content: translations live in **suffixed columns on the same row**
  (`title`, `title_ko`, `title_de`). Never read those columns directly — use
  `getLocalizedField(row, 'title', locale)`, which falls back to the base (English) column.
- New translatable DB content needs: the `_ko`/`_de` columns (migration), a
  `getLocalizedField` call at every read site, and a hook into the auto-translate helpers.

### Sister sites (4sgtour.de / 4sgtour.at) — three repos, one product

This product ships as **three separate repositories and three separate Vercel deployments** that
are otherwise the same codebase:

| Site | Repo | Local path (this machine) | Default locale |
| --- | --- | --- | --- |
| 4sgtour.com | `BustosAndrew/4sgtour.com` | `~/Documents/GitHub/v0-golf` | `en` |
| 4sgtour.de | `BustosAndrew/4sgtour-de` | `~/Documents/GitHub/4sgtour-de` | `de` |
| 4sgtour.at | `BustosAndrew/4sgtour-at` | `~/Documents/GitHub/4sgtour-at` | `de` |

The GitHub repo behind 4sgtour.com was renamed from `v0-golf` to `4sgtour.com`; the local folder
is still `v0-golf`, and `v0-golf` below always means that checkout.

They are **not** a monorepo, and there is no sync automation, no shared package, and no
domain-conditional logic. Each repo is a full copy that drifts unless changes are copied by hand.

#### Ask before applying a change to the other two repos

The three repos are meant to stay in sync, but **never propagate a change on your own**. Not every
change belongs on all three sites, and the user decides which do.

Workflow:

1. Make and verify the change in the repo you were asked to work in — only that repo.
2. **Ask the user whether the change should also be applied to the other two**, and wait for an
   answer. Ask once the change is done, not before starting.
3. If they say yes, apply it to the other checkouts, adapting the per-site values below.
   Re-apply the edit in each repo rather than copying whole files — a blind file copy clobbers
   the intentional per-site differences.
4. Type-check or build each repo you touched (`npx tsc --noEmit`) — the copies are not identical,
   so a clean build in one does not prove a clean build in another.
5. Commit in each repo separately with the same message. Only push when the user asks.

This applies to everything: code, migrations in `scripts/`, `messages/*.json` keys, config, and
these AI docs. When the answer is no, the repos have deliberately diverged — note it rather than
"fixing" it on a later pass.

#### The only intentional per-site differences

Everything else should stay byte-identical. Never "fix" these to match:

| What | 4sgtour.com (`v0-golf`) | 4sgtour.de / 4sgtour.at |
| --- | --- | --- |
| `defaultLocale` in [lib/i18n/config.ts](lib/i18n/config.ts) | `'en'` | `'de'` |
| `NEXT_LOCALE` cookie seeded in [proxy.ts](proxy.ts) | `'en'` | `'de'` |
| `images.unoptimized` in [next.config.js](next.config.js) | absent | `true` |
| [vercel.json](vercel.json) (Vercel Cron) | present | **absent** — the cron routes exist but nothing schedules them |
| Partner API (`/admin/api-access`, `/api/admin/api-keys`, `/api/v1/*`, `lib/api-keys.ts`, migrations `054`/`055`) | present | **absent** — and the API Access item is absent from their `admin-sidebar.tsx` too |
| `Sitemap:` line in [public/robots.txt](public/robots.txt) | `4sgtour.com` | each site's own domain |
| git remote / Vercel project | `v0-golf` | `4sgtour-de`, `4sgtour-at` |

The partner API is `.com`-only by the user's explicit decision (2026-08-15), not by oversight:
all three sites share one Supabase project, so a key issued anywhere already works against all
three deployments and one issuing surface is enough. Their `admin-sidebar.tsx` is otherwise
byte-identical to this repo's — it just omits the API Access `<Link>` and the `KeyRound` /
`usePathname` imports. Do not "restore" it.

Apart from those, the three repos are byte-identical — deliberately, so a change can be moved
between them as a patch (`git diff` here, `git apply` there) instead of being retyped.
`4sgtour-de` and `4sgtour-at` are identical to each other. Environment variables
(`NEXT_PUBLIC_SITE_URL`, Stripe keys, `CRON_SECRET`, …) are set per Vercel project, not in code.

**Never add `vercel.json` to the `.de`/`.at` repos.** This is the single most damaging sync
mistake available. Both daily jobs query `stripe_bookings` with **no site filter** — they process
every booking from all three sites, because all three share one Supabase project. Neither job
takes a lock: [charge-remaining-balance](app/api/cron/charge-remaining-balance/route.ts) selects
rows with `remaining_balance_charged = false`, calls `stripe.paymentIntents.create()`, and only
then marks the row; `send-payment-reminders` does the same around `payment_reminder_sent_at`.
Three deployments firing at 08:00 UTC would each read the same unmarked rows before any of them
wrote, and **charge each customer up to three times**. Cron belongs in this repo only.

Because cron runs only here, it must not assume its own domain is the customer's. Both
`stripe_bookings` and `inquiries` carry a nullable `site_url` (migration `053`) recorded at
creation, and the jobs resolve the sender and links from that per row — see below. Rows created
before `053` have `site_url = null` and fall back to the running deployment, which is exactly the
old behaviour.

#### Absolute URLs and email addresses come from helpers

Never hard-code a domain or an address. Two helpers derive everything from the deployment:

- [lib/site-url.ts](lib/site-url.ts) — `getSiteUrl()` returns `NEXT_PUBLIC_APP_URL ||
  NEXT_PUBLIC_SITE_URL || 'https://4sgtour.com'`, without a trailing slash. Used by Stripe return
  URLs, email links, `metadataBase`, the OpenGraph `url`, and [app/sitemap.ts](app/sitemap.ts).
- [lib/site-email.ts](lib/site-email.ts) — `getFromEmail()`, `getAdminEmail()`,
  `getSupportEmail()`, derived from `getSiteUrl()`'s hostname, so each site sends as
  `noreply@<its own domain>` and notifies `info@<its own domain>`.
  `RESEND_FROM_EMAIL` / `ADMIN_EMAIL` / `SUPPORT_EMAIL` override.
  Each takes an **optional site URL** — `getFromEmail(booking.site_url)` — for code sending on
  behalf of a site other than the one running it. That is only the cron jobs today, but any new
  background job that mails a customer must pass the row's `site_url` too, or `.de`/`.at`
  customers get `.com` mail. An unparseable or null argument falls back to the deployment.

Two traps that follow:

1. **`NEXT_PUBLIC_*` is inlined at build time.** Setting or changing one of these in Vercel does
   nothing until the project is redeployed — it is not read at runtime. This affects canonical
   URLs, OpenGraph tags, Stripe return URLs and email senders.
2. **Resend rejects a `from:` on an unverified domain.** `4sgtour.de` and `4sgtour.at` are
   verified as of 2026-08-14. If a new domain is added, verify it in Resend first or set
   `RESEND_FROM_EMAIL` to a verified address on that project.

#### Locale rules that follow from this

- Never drop or rename a `de` message key or a `_de` database column on the assumption German is
  a secondary locale — it is the primary locale for two of the three sites.
- Page metadata is localized: [app/layout.tsx](app/layout.tsx) uses `generateMetadata()` reading
  the `metadata` namespace from `messages/*.json`, and the OpenGraph locale follows the
  *visitor's* locale via `openGraphLocales` in [lib/i18n/config.ts](lib/i18n/config.ts) — not the
  site default. New metadata copy needs keys in all three message files.
- [components/site-footer.tsx](components/site-footer.tsx) is the same in all three repos: it
  carries the branch links and the `info@4sgtour.de` / `info@4sgtour.at` addresses.

#### Keeping these docs in sync

`CLAUDE.md` and [.github/copilot-instructions.md](.github/copilot-instructions.md) exist in all
three repos and follow the same ask-first rule. Each repo's copy describes itself as the current
repo, so if the user does want a docs change carried over, update the wording rather than pasting
this file verbatim.

### Auto-translation

[lib/auto-translate.ts](lib/auto-translate.ts) fans out to `/api/translate` and
`/api/translate/batch`, which call `openai/gpt-5-mini` through the AI Gateway. Admin create/update
routes invoke it after writing a row so `_ko`/`_de` columns are filled in the background.

- Wrap fan-out in `runWithConcurrency()` ([lib/run-with-concurrency.ts](lib/run-with-concurrency.ts))
  to stay under gateway rate limits.
- The route rejects placeholder-looking output and returns `null`; callers must skip persisting
  it rather than writing a broken half-localized value.
- Existing translations are not overwritten by `autoTranslateNamedRows`.

### Payments

- Server Actions in [app/actions/stripe.ts](app/actions/stripe.ts) create Checkout Sessions —
  card or ACH, deposit (`trips.deposit_percentage`) or full payment.
- **Never charge a price the browser sends.** Server actions are public POST endpoints. Pricing
  rules live in [lib/booking-price.ts](lib/booking-price.ts), shared by the booking form and
  the server; [lib/resolve-booking-price.ts](lib/resolve-booking-price.ts) recomputes the total,
  deposit % and package name from the database and refuses if the customer's figure differs.
  Both the checkout action and the SMS payment link go through it — change prices there only.
  Those actions **return** `{ ok: false, code }` instead of throwing (Next.js hides thrown
  messages in production), and the payment screen creates the session *before* mounting
  Stripe's embedded form, so it can explain a refusal and refresh the price in place.
- The **single-room surcharge is per trip** (`trips.single_occupancy_surcharge`, a percentage,
  default 12, migration `061`), added for each traveler who picks a single room. Read it with
  `getSingleSurchargeRate(trip)` — never hard-code 12%; 0 is a real value (no surcharge).
- Saving a trip updates its `packages` rows **in place** (by id). Never go back to
  delete-and-reinsert: new ids null `stripe_bookings.package_id` (`ON DELETE SET NULL`) and
  break checkout for anyone mid-booking with "Package not found".
- [app/api/stripe/webhook/route.ts](app/api/stripe/webhook/route.ts) is the only writer that
  confirms a `stripe_bookings` row. Verify signatures with `STRIPE_WEBHOOK_SECRET`. The Stripe
  endpoint must be subscribed to: `checkout.session.completed`, `checkout.session.expired`,
  `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`,
  `payment_intent.succeeded`, `payment_intent.payment_failed`.
- **US bank (ACH) payments settle days later.** `checkout.session.completed` then arrives with
  `payment_status: 'unpaid'`: the row is written as `processing` (migration `058`) and the
  customer is told it's clearing; `async_payment_succeeded` confirms it (re-running the normal
  path), `async_payment_failed` marks it `failed` and emails both sides. Never treat
  `completed` alone as paid. The balance cron's bank debits return `processing` too: it marks
  the balance charged at once (so the next run can't debit again) and the webhook's
  `payment_intent.*` handlers settle or re-open it. Cron charges carry a per-booking-per-day
  idempotency key.
- **Declined balance charges** are retried on up to 3 daily runs (`stripe_bookings.charge_attempts`,
  migration `059`); then auto-charging stops for that booking (`auto_charge_date = null`) and the
  admin and customer are emailed. The admin is emailed on the first failure and when it stops —
  not daily. `authentication_required` (3-D Secure) stops at once: off-session can't pass it.
- **Every card payment carries the 4% card processing fee** (`CARD_PROCESSING_FEE_RATE` /
  `cardFeeCents()` in [lib/booking-price.ts](lib/booking-price.ts)) — checkout, SMS links,
  custom packages, balances and the balance auto-charge. Bank (ACH) payments have none. A Stripe
  page can't add a fee only when a card is chosen, so **never create a session that accepts both
  card and bank**: each Pay button names its method and gets a single-method session, the card
  one with a fee line item. The charge cron decides by asking Stripe whether the *saved payment
  method* is a card (`isCardPaymentMethod()`, [lib/stripe-card-fee.ts](lib/stripe-card-fee.ts)),
  because older SMS-link and custom-package rows say `payment_method = 'sms_link'` whatever was
  used. `processing_fee` accumulates every fee collected; `total_paid` includes them.
- [app/actions/send-payment-link.ts](app/actions/send-payment-link.ts) texts a link to
  **`/pay/[id]`** (id = the pending `stripe_bookings` row, generated before the text so it can go
  in it) when a customer picks "SMS payment link" at checkout on a standard trip. That page
  offers bank transfer or card (+4%); `/api/pay/[id]/checkout` creates the session on demand,
  closes any earlier one, and moves the booking and its inquiry from the `paylink_<id>`
  placeholder to the real session id (the webhook matches by session id). Links last 24 hours.
  Read with the service role ([lib/payment-link-server.ts](lib/payment-link-server.ts)) — the
  unguessable id is the credential, as with `/package/[id]`.
- **Admin → Payments** ([components/admin/payments-list.tsx](components/admin/payments-list.tsx),
  `GET /api/admin/payments`) lists pending checkouts / SMS links, clearing bank payments, balances
  due and paid bookings, read through [lib/admin-payments.ts](lib/admin-payments.ts)
  `toAdminPayment()` — the one place that decides what a row has paid (a `pending` row's
  `total_paid` is what it *would* charge, not money received). *Cancel payment*
  (`/api/admin/bookings/[id]/cancel-pending`) expires the Stripe session and marks the row
  `expired` with `booking_details.admin_cancelled_at`, which `/pay/[id]` also honours.
  *Change charge date* (`/api/admin/bookings/[id]/schedule`) sets `auto_charge_date` (saved
  payment method; `null` stops auto-charging, a date restarts the 3 retries) or
  `remainder_due_date` (no saved method), re-arms the reminder, and for a custom package updates
  the inquiry's `remainder_due_date` / `balance_flow` too.
- Stripe's hosted pages return customers to `/checkout/custom/success` — public, because most
  are guests and `/bookings` requires signing in.
- Vercel Cron ([vercel.json](vercel.json)) runs daily:
  `/api/cron/charge-remaining-balance` (08:00 UTC) and `/api/cron/send-payment-reminders`
  (09:00 UTC). Both authenticate with `Bearer ${CRON_SECRET}` and use the service-role client.

### Custom packages

Admin-built, per-customer trips (`trips.is_custom`) with one `inquiries` row
(`is_custom_package`). Created at **Admin → Inquiries → Create custom booking**
([app/api/admin/custom-booking](app/api/admin/custom-booking/route.ts)), edited at
`/admin/trips/[id]`.

- The customer is texted a link to **`/package/[id]`** (id = inquiry id) and pays there. That
  page and `/api/package/[id]/checkout` read with the **service-role** client
  ([lib/supabase/service.ts](lib/supabase/service.ts)): customers arrive signed out, and RLS only
  lets admins read inquiries. The unguessable id is the credential. Select only the columns the
  page shows ([lib/custom-package-server.ts](lib/custom-package-server.ts)).
- **No Stripe session is created up front.** Each Pay button posts to
  `/api/package/[id]/checkout`, which creates a fresh session from the inquiry's current
  `total_price` / `deposit_percentage`. Stripe caps `expires_at` at 24 hours, and a pre-made
  session kept charging the old price after an admin edit.
- What has been paid comes from `stripe_bookings` rows linked by `inquiry_id` (migration `058`),
  written by the webhook's custom-package branch — never from `inquiries.status`.
  [lib/custom-package.ts](lib/custom-package.ts) `getCustomPackageState()` is the one place that
  turns those rows into what the page offers.
- `inquiries.balance_flow` is the admin's choice for the remaining balance: `auto_charge` (card
  saved at deposit; the charge cron bills it on `remainder_due_date`) or `pay_link` (the page shows
  "Pay remaining balance"). If a card wasn't actually saved, the page falls back to the button.
- **Cancel vs delete** (Admin → Inquiries): anything with payments can be cancelled (record and
  payment history kept, `status = 'cancelled'`, no further charges or reminders, no automatic
  refund) or deleted permanently. A cancelled custom package's page takes no more payments.
- **Messages belong to inquiries**, but paid bookings are listed by booking id. The messages API
  accepts either and maps a booking to its conversation, starting one if needed
  ([lib/booking-conversation.ts](lib/booking-conversation.ts)). Admin → Inquiries hides the
  inquiry an SMS payment link writes beside its booking (same Stripe session), so each paid
  booking is listed once and its thread is reached through it.
- Tournament ticket requests are saved as inquiries with `inquiry_type = 'tournament'` and
  `tournament_event_id` (migration `059`) — not `trip_id`, which references `trips`. Admin →
  Inquiries filters by type (trips / tournaments / custom).
- Packages paid through the old pre-created links have no linked rows; an inquiry marked
  `converted` with a deposit under 100% is treated as deposit-paid (remainder payable, reminded
  from the inquiry). Editing the price after a deposit recalculates the balance on the booking row.
- Edits update child rows (packages, courses, meals, transport, services) **in place by id** so
  their `_ko`/`_de` translations survive; never delete-and-reinsert them.

### Cancellations & refunds

The cancellation policy on `/terms` is enforced in code by
[lib/cancellation-policy.ts](lib/cancellation-policy.ts) — pure, shared by the browser and the
server. Change fee tiers there and in the Terms copy together.

- **Customers cancel, admins refund.** My Bookings → *Cancel booking* shows the fee and estimated
  refund, then posts to `/api/bookings/[id]/cancel`, which recomputes the quote (refusing with
  `quote_changed` if it differs from what was shown), cancels at once (no further charges or
  reminders; a custom package's inquiry is cancelled too) and emails both sides. Nothing is
  refunded automatically: Admin → Inquiries shows *Refund pending* and a **Refund** button
  (`/api/admin/bookings/[id]/refund`) offering the policy refund, a full refund (company
  cancellation, e.g. too few participants), another amount, or closing with none.
- Each trip has `trips.cancellation_schedule` (`standard` 50/60/80/100% or `western_us`
  20/50/80/100%, migration `060`), set in all four trip/custom-package forms.
- Fee = tier % × **trip total**, by calendar days before departure in **US Eastern** time.
  Refund = paid toward the trip (excluding card processing fees) − fee, floored at 0 — an unpaid
  balance is never charged. Booked the day before departure → no refund. Card refunds issued after
  the day of payment lose 8%, applied at refund time (it depends on the refund date).
- The fee is **frozen on the row at cancellation** (`cancellation_*` columns), because cancelling
  sets `remaining_balance_charged = true` and the paid amount can't be recovered afterwards.
  Admin cancels record `cancellation_paid_amount` too (via `cancelBookingsAsAdmin()`); unpaid
  `pending` rows are just closed.
- Self-cancel is refused while a bank payment is clearing and after departure.
- Refunds draw from the balance PaymentIntent first, then the deposit, with per-portion Stripe
  idempotency keys; the row becomes `refunded` (or stays `cancelled` with `refund_amount = 0`).
  The 4% company-check refund fee in the policy is not modelled — refunds go back through Stripe.

### SMS (Twilio)

- Every number sent to Twilio must be **E.164**. Collect phones with
  [components/phone-input.tsx](components/phone-input.tsx) (country picker → E.164) and validate
  server-side with `normalizeE164()` from [lib/phone.ts](lib/phone.ts) — it also drops trunk
  prefixes (Korean `010-…` → `+8210…`). Background senders use `phoneForSms()`, which keeps
  legacy non-E.164 values as they were.
- Send the text **before** writing rows that depend on it, so a Twilio failure leaves nothing
  behind (the SMS payment link action is the exception: its row *is* the `/pay/[id]` link, so
  it writes the row first and deletes it if Twilio refuses).
- Texts are English-only by decision. Twilio's A2P campaign registration must be in English;
  translated texts later need samples (with English translations) added to the campaign first.
- Reminders ([send-payment-reminders](app/api/cron/send-payment-reminders/route.ts)) are driven
  only by `stripe_bookings` with an outstanding balance — 5 days before `auto_charge_date` or
  `remainder_due_date`.

### Partner API (4sgtour.com only)

Read-only feed of recently published trips for third-party partners (built for Tiger Booking),
authenticated with a key issued at **Admin → API Access**. Reference:
[docs/partner-api.md](docs/partner-api.md); the partner-facing copy is
[docs/partner-api-instructions.md](docs/partner-api-instructions.md).

- Keys are `4sg_live_<32 random bytes>`; only `sha256(key)` is stored, so the plaintext is shown
  once at creation and is unrecoverable. `key_prefix` is display-only.
- Revoking is a soft delete (`revoked_at`) — the row stays so `last_used_at` and the audit trail
  survive. Takes effect on the next request; nothing is cached.
- Two different clients on purpose: the admin page and `/api/admin/api-keys` use the
  **cookie-bound** client so RLS is a second gate after `getUserType()`, and never select
  `key_hash` into anything reaching a browser. `authenticateApiKey()` and `/api/v1/*` use the
  **service-role** client — the caller is a machine with no Supabase session, so RLS would hide
  every row. Same exception the cron routes make.
- **Custom trips need two gates**: `api_keys.allow_custom_trips` (granted per key by an admin)
  *and* `?include_custom=true` (the partner opts in per request). Without the parameter the
  endpoint filters `.neq('is_custom', true)`, matching the public pages; with the parameter but
  without the grant it returns 403 `custom_trips_not_permitted` rather than silently falling back.
  A custom trip is a private, per-customer itinerary — never widen this without asking.

### Routes

Public: `/`, `/destinations`, `/destinations/[continent]`,
`/destinations/[continent]/[destination]`, `/trips/[slug]`, `/trips/[slug]/book`,
`/package/[id]`, `/pay/[id]` (SMS payment links), `/tournaments`, `/tournaments/[slug]`, `/tournaments/[slug]/[eventSlug]`,
`/tournaments/[slug]/[eventSlug]/tickets`, `/contact`, `/privacy`, `/terms`

Authenticated: `/bookings`, `/favorites`, `/auth/*` (`login`, `sign-up`, `callback`,
`complete-profile`, `reset-password`, `update-password`)

Public, reached from Stripe: `/checkout/custom/success`

Admin: `/admin`, `/admin/api-access`, `/admin/trips/new`, `/admin/trips/[id]`,
`/admin/tournaments`, `/admin/tournaments/[id]`, `/admin/tournaments/[id]/events/new`,
`/admin/tournaments/[id]/events/[eventId]`

API: `/api/admin/*` (trips, tournaments, inquiries, messages, custom-booking, stripe/generate,
translate-*, api-keys, payments, bookings/[id]/refund, bookings/[id]/cancel-pending,
bookings/[id]/schedule), `/api/inquiry`, `/api/messages`,
`/api/tournament-tickets`, `/api/upload`, `/api/translate`, `/api/translate/batch`,
`/api/stripe/webhook`, `/api/cron/*`, `/api/pay/[id]/checkout` (SMS-link payments, public),
`/api/package/[id]/checkout` (custom-package payments,
public), `/api/bookings/[id]/cancel` (customer self-cancellation, signed in)

Partner (this repo only, bearer-authenticated): `/api/v1/trips/latest` — see
[Partner API](#partner-api-4sgtourcom-only).

### Database

Tables in active use: `profiles`, `trips`, `trip_images`, `trip_golf_courses`,
`trip_meal_options`, `trip_transportation_options`, `trip_service_options`, `packages`,
`add_ons`, `inquiries`, `stripe_bookings`, `messages`, `favorites`, `destinations` (legacy),
`tournaments`, `tournament_events`, `tournament_event_itinerary_days`,
`tournament_event_pricing_tiers`, `tournament_event_gallery_images`, `api_keys`.

`stripe_bookings.site_url` and `inquiries.site_url` (nullable, migration `053`) record which of
the three sites the row came from. Set them at **every** new creation path — the checkout action,
the SMS payment link, the admin custom booking, the inquiry route — and carry the value through
Stripe session metadata when the row is written by the webhook, which always runs on `.com`.
A row without it silently reverts to `.com` branding for that customer.

TypeScript row types live in [lib/types/database.ts](lib/types/database.ts) and are hand-written —
they are not generated from the schema, so update them alongside every migration.

Read with nested selects rather than multiple round-trips:

```typescript
const { data } = await supabase.from('trips').select(`
  *,
  packages(id, name, price),
  trip_golf_courses(course_name, max_rounds, description)
`)
```

RLS is enabled everywhere: most reads are public, writes are admin-only. Policies are defined in
the migrations, so a query that "works locally but returns nothing" is usually an RLS issue,
not a query bug.

### Migrations

Numbered SQL files in [scripts/](scripts/), applied **by hand in the Supabase SQL editor** —
there is no migration runner and no local Supabase instance. Numbers have collided historically
(two `043_`, `044_`, `045_`, `046_`, `050_`, `052_` files exist), so pick the next unused number
and don't assume ordering is total. `061` is the highest so far. `061`
(`trips.single_occupancy_surcharge`) was written on 2026-11-22 and must run *before* its code
ships — checkout's price check selects the column, so without it every checkout fails. `060` (booking cancellations:
`trips.cancellation_schedule`, `stripe_bookings.cancelled_at`/`cancellation_*`/`refund_*`) was
written on 2026-11-17 and must run *before* its code ships — My Bookings and the trip forms read
and write its columns. `056`, `057` and `058` were
applied by 2026-11-16; `059` (tournament ticket inquiries, customer RLS on the confirmed email)
must be run by hand *before* the code that writes `inquiries.tournament_event_id` is deployed. `054`/`055` were applied on
2026-08-15; `056` (booking status/RLS), `057` (block self-promotion to admin) and `058` (custom
package payments: `stripe_bookings.inquiry_id`, `inquiries.balance_flow`) were written on
2026-11-16 and must be applied by hand — check before assuming they are live. `058` must run
*before* the code that writes its columns is deployed. Schema changes require a new script *and* a matching edit to
`lib/types/database.ts`.

The script is applied by hand, so **a migration and the code that depends on it deploy
separately**. When new code writes a new column, the SQL has to be run *before* that code ships,
or every insert fails. Say so explicitly when handing over a migration.

## Conventions

- Prettier ([.prettierrc.json](.prettierrc.json)): no semicolons, single quotes, trailing commas,
  2-space indent, 80 columns. Parts of the codebase predate this — match the file you're editing.
- Log with a `[v0]` or `[feature-name]` prefix; that's the existing convention for grepping
  Vercel logs.
- Add UI primitives through `npx shadcn@latest add` so they land in `components/ui/` with the
  configured aliases.
- Images: use `next/image`. New remote hosts must be added to `remotePatterns` in
  [next.config.js](next.config.js), and any non-default `quality` value must be listed in
  `images.qualities` — Next 16 silently falls back to 75 otherwise.

## Gotchas

1. **Type errors fail the build.** `ignoreBuildErrors` is not set, so `pnpm build` is a real gate.
2. **`getUserType()` returns `'regular'` on any failure** — missing profile, RLS denial, thrown
   error. It fails closed, so never treat a non-admin result as evidence the user is signed out.
   Roles are `regular | wholesale | admin` (CHECK constraint, migration `001`); the sign-up
   trigger (`024`) always creates `regular`. Migration `034` renamed *packages* named "Regular" to
   "Basic" — it did not touch roles. Migration `057` blocks non-admins from changing `user_type`.
3. **Only `packages` carry a price.** Golf courses, meals, transportation, and service options
   have `is_included` flags and descriptions, never prices.
4. **`trips.continent` is current; `trips.destination_id` is nullable legacy.** Filter on
   `continent`.
5. **Trip slugs append a timestamp** to avoid collisions, so they are not derivable from a title.
6. **`/api/upload` is admin-only and images-only** (JPEG/PNG/WebP/AVIF/GIF, ≤ 4.5 MB), by the
   user's decision on 2026-11-16 — every caller is an admin screen. No SVG: it can carry scripts.
7. **Trip/tournament fields are edited in three places**: the create form, the edit form (both in
   `components/admin/`, and both large — 2400+ and 3000+ lines), and the API route handler. A
   field added to only one of them will silently not persist.
8. **Secrets are not committed.** `.env*` is gitignored; the local `.env` holds only the public
   Supabase/site values plus `BLOB_READ_WRITE_TOKEN` and `RESEND_API_KEY`. Pull the rest from
   Vercel.
9. **Ask before syncing a change to the sibling repos.** `v0-golf`, `4sgtour-de`, and
   `4sgtour-at` are independent checkouts with no sync automation, so nothing propagates by
   itself — but the user decides which changes belong on all three. Finish the change in the
   repo you were asked to work in, then ask.

## Environment variables

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase clients (required) |
| `SUPABASE_SERVICE_ROLE_KEY` | cron jobs, RLS bypass — server only |
| `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` | absolute URLs in emails, Stripe redirects |
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` | local auth callback override |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET` | payments |
| `RESEND_API_KEY`, `ADMIN_EMAIL`, `SUPPORT_EMAIL` | transactional email |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | SMS payment links |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob uploads |
| `CRON_SECRET` | authenticates Vercel Cron requests |

AI Gateway credentials are supplied by Vercel at runtime; no key is read from `process.env` for
translation.
