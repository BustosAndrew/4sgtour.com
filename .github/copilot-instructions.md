# 4sgtour.com — AI Agent Instructions

Golf trip booking platform: public browsing/booking (trips + tournament events) with Stripe
checkout, plus a protected admin dashboard. Next.js 16 App Router, React Server Components by
default. See [CLAUDE.md](../CLAUDE.md) at the repo root for the fuller guide.

## Stack

- Next.js 16 (App Router) + React 19, TypeScript strict
- Supabase (Postgres + Auth + RLS) via `@supabase/ssr`
- Tailwind CSS v4 (no `tailwind.config` — theme lives in `app/globals.css`), shadcn/ui + Radix
- Stripe, Resend, Twilio, Vercel Blob, Vercel Cron
- AI SDK v6 through the Vercel AI Gateway for translations
- Path alias `@/*` → project root

## Commands

```powershell
pnpm dev          # dev server on :3000
pnpm build        # production build — the real correctness gate
npx tsc --noEmit  # type check only
```

`pnpm lint` is broken: eslint is not installed and there is no `eslint.config.*`. There are no
tests. Type errors **do** fail the build (`ignoreBuildErrors` is not set).

## Critical patterns

### Server vs client components

Default to Server Components, which query Supabase directly. Add `"use client"` only for
interactivity, browser APIs, or Radix wrappers (everything in `components/ui/`).

### Two Supabase clients — never mix them

```typescript
// Server Components, Route Handlers, Server Actions
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()   // async, cookie-bound

// Client Components only
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()          // browser singleton
```

Cron routes are the exception: they construct a service-role client with `@supabase/supabase-js`
to bypass RLS.

### Auth and authorization

`proxy.ts` is the middleware entry point in Next.js 16 (not `middleware.ts`). It refreshes the
Supabase session, redirects anonymous users away from `/admin`, `/bookings`, `/dashboard`, and
seeds the `NEXT_LOCALE` cookie. It does **not** check roles — every admin page and
`/api/admin/*` route must re-check server-side:

```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/auth/login')
const userType = await getUserType()   // '@/lib/supabase/get-user-type'
if (userType !== 'admin') redirect('/')
```

`getUserType()` fails closed — it returns `'regular'` on missing profiles, RLS denials, and
thrown errors — so a non-admin result is not evidence the user is signed out.

### Internationalization

Locales are `en | ko | de`, selected by the `NEXT_LOCALE` cookie. There are **no `/[locale]`
route segments**.

- UI copy: `messages/{en,ko,de}.json`, namespaced. Server: `getServerTranslations(namespace)`
  from `@/lib/i18n/server`. Client: `I18nProvider` from `@/lib/i18n/provider`. All three files
  must stay key-compatible.
- DB content: translations live in suffixed columns on the same row (`title`, `title_ko`,
  `title_de`). Always read via `getLocalizedField(row, 'title', locale)`, which falls back to the
  English column — never read `_ko`/`_de` columns directly.
- Admin create/update routes call `lib/auto-translate.ts`, which fans out to `/api/translate` and
  `/api/translate/batch` (AI Gateway, `openai/gpt-5-mini`). Wrap fan-out in
  `runWithConcurrency()` to respect rate limits, and skip persisting a `null` translation.

**Sister sites:** 4sgtour.de and 4sgtour.at are separate deployments of this product whose default
locale is `de`. This repo has no domain-conditional logic, so locale-default and message-key
changes must be carried over manually. Never treat German as an optional secondary locale. Build
absolute URLs as `process.env.NEXT_PUBLIC_APP_URL || 'https://4sgtour.com'`.

### Payments

Checkout Sessions are created in `app/actions/stripe.ts` (card or ACH; deposit via
`trips.deposit_percentage`, or full payment). `/api/stripe/webhook` handles
`checkout.session.completed` / `.expired` and is the only writer that confirms a `stripe_bookings`
row. Two Vercel Cron jobs (`vercel.json`) run daily and authenticate with `Bearer ${CRON_SECRET}`:
`/api/cron/charge-remaining-balance` (08:00 UTC) and `/api/cron/send-payment-reminders`
(09:00 UTC). Admin-created custom bookings can be paid via a Twilio SMS link
(`app/actions/send-payment-link.ts`).

### Database

Active tables: `profiles`, `trips`, `trip_images`, `trip_golf_courses`, `trip_meal_options`,
`trip_transportation_options`, `trip_service_options`, `packages`, `add_ons`, `inquiries`,
`stripe_bookings`, `messages`, `favorites`, `tournaments`, `tournament_events`,
`tournament_event_itinerary_days`, `tournament_event_pricing_tiers`,
`tournament_event_gallery_images`. `destinations` is legacy.

Row types in `lib/types/database.ts` are hand-written, not generated — update them with every
migration. Fetch related data with nested selects:

```typescript
const { data } = await supabase.from('trips').select(`
  *,
  packages(id, name, price),
  trip_golf_courses(course_name, max_rounds, description)
`)
```

RLS is on everywhere (public reads, admin-only writes), so an empty result is more often a policy
issue than a query bug.

### Migrations

Numbered SQL files in `scripts/`, applied by hand in the Supabase SQL editor. No migration runner,
no local Supabase. Numbers have collided historically — pick the next unused number, and don't
assume ordering is total.

## Conventions

- Prettier (`.prettierrc.json`): no semicolons, single quotes, trailing commas, 2-space indent,
  80 columns. Older files predate this — match the file you're editing.
- Log with a `[v0]` or `[feature-name]` prefix for grepping Vercel logs.
- Add UI primitives with `npx shadcn@latest add` so they land in `components/ui/`.
- `next/image` only. New remote hosts go in `remotePatterns` in `next.config.js`; any non-default
  `quality` value must be listed in `images.qualities` or Next 16 silently falls back to 75.

## Gotchas

1. Only `packages` have prices. Golf courses, meals, transportation, and service options carry
   descriptions and `is_included` flags — never prices.
2. `trips.continent` is current; `trips.destination_id` is nullable legacy. Filter on `continent`.
3. Trip slugs append a timestamp, so they aren't derivable from a title.
4. `/api/upload` requires authentication but deliberately not admin — don't "fix" it.
5. Adding a trip/tournament field means editing three places: the create form, the edit form (both
   in `components/admin/`, 2400+ and 3000+ lines), and the API route handler. Miss one and the
   field silently fails to persist.
6. Migration `034` renamed the role to `basic`, but the code still compares against `'regular'`.
   Check the actual `profiles.user_type` values before changing either side.
7. `.env*` is gitignored — pull secrets from Vercel.

## Environment variables

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`,
`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`,
`RESEND_API_KEY`, `ADMIN_EMAIL`, `SUPPORT_EMAIL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
`TWILIO_PHONE_NUMBER`, `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`.

AI Gateway credentials come from Vercel at runtime; no key is read from `process.env`.
