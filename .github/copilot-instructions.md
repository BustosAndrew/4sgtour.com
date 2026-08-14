# 4sgtour.com — AI Agent Instructions

Golf trip booking platform: public browsing/booking (trips + tournament events) with Stripe
checkout, plus a protected admin dashboard. Next.js 16 App Router, React Server Components by
default. See [CLAUDE.md](../CLAUDE.md) at the repo root for the fuller guide.

> **Three repos, one product.** This is the 4sgtour.com repo (`v0-golf`). The same codebase also
> ships as `4sgtour-de` and `4sgtour-at` (both at `~/Documents/GitHub/`). **Ask before applying a
> change here to either sibling** — see [Three-repo workflow](#three-repo-workflow).

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

Never treat German as an optional secondary locale — it is the default for two of the three sites
(below). Page metadata is localized too: `app/layout.tsx` uses `generateMetadata()` over the
`metadata` namespace in `messages/*.json`, with the OpenGraph locale following the visitor's
locale via `openGraphLocales` in `lib/i18n/config.ts`.

### Never hard-code a domain or an email address

Two helpers derive both from the running deployment — use them for anything absolute:

- `getSiteUrl()` (`lib/site-url.ts`) — `NEXT_PUBLIC_APP_URL || NEXT_PUBLIC_SITE_URL ||
  'https://4sgtour.com'`, no trailing slash. Backs Stripe return URLs, email links,
  `metadataBase`, the OpenGraph `url` and `app/sitemap.ts`.
- `getFromEmail()` / `getAdminEmail()` / `getSupportEmail()` (`lib/site-email.ts`) — derived from
  that hostname, so each site sends as `noreply@<its own domain>`. `RESEND_FROM_EMAIL`,
  `ADMIN_EMAIL`, `SUPPORT_EMAIL` override. Each accepts an optional site URL
  (`getFromEmail(booking.site_url)`) for code mailing on behalf of another site — the cron jobs
  do this; any new background job must too.

`stripe_bookings.site_url` / `inquiries.site_url` (nullable, migration `053`) record the origin
site. Set them on every new creation path, and pass the value through Stripe session metadata
when the webhook is the writer — it always runs on `.com` and cannot infer the origin otherwise.

`NEXT_PUBLIC_*` values are **inlined at build time** — changing one in Vercel does nothing until
that project redeploys. And Resend rejects a `from:` on an unverified domain (`.de`/`.at` are
verified as of 2026-08-14).

Auth callbacks derive their origin from the request, so they need no per-site code — but every
origin must be in the shared Supabase project's Redirect URLs allow-list, or it silently falls
back to the Site URL (`https://4sgtour.com`). Password reset points at
`/auth/callback?redirect=/auth/update-password` so the recovery code is exchanged for a session
before the form loads.

### Three-repo workflow

The product ships as three independent repos and three Vercel deployments — not a monorepo, no
sync automation, no domain-conditional logic:

| Site | Repo | Local path | Default locale |
| --- | --- | --- | --- |
| 4sgtour.com | `BustosAndrew/4sgtour.com` | `~/Documents/GitHub/v0-golf` | `en` |
| 4sgtour.de | `BustosAndrew/4sgtour-de` | `~/Documents/GitHub/4sgtour-de` | `de` |
| 4sgtour.at | `BustosAndrew/4sgtour-at` | `~/Documents/GitHub/4sgtour-at` | `de` |

The GitHub repo behind 4sgtour.com was renamed from `v0-golf` to `4sgtour.com`; the local folder
is still `v0-golf`, and `v0-golf` below always means that checkout.

The three are meant to stay in sync, but **never propagate a change on your own**. Make and verify
the change in the repo you were asked to work in, then **ask the user whether it should also go to
the other two** and wait for an answer. This covers code, `scripts/` migrations, `messages/*.json`
keys, config, and these AI docs alike.

If they say yes: re-apply the edit in each repo rather than copying whole files (a blind copy
clobbers the per-site differences below), type-check each one (`npx tsc --noEmit`), and commit in
each repo separately with the same message. If they say no, the repos have deliberately diverged —
note it instead of "fixing" it later.

The only intentional differences, which must never be "fixed" to match:

- `defaultLocale` in `lib/i18n/config.ts` — `'en'` on `.com`, `'de'` on `.de`/`.at`
- the `NEXT_LOCALE` cookie seeded in `proxy.ts` — same split
- `images.unoptimized: true` in `next.config.js` — `.de`/`.at` only
- `vercel.json` — this repo only; the cron routes exist in all three but are scheduled only here.
  **Never add `vercel.json` to `.de`/`.at`.** Both jobs query `stripe_bookings` with no site
  filter (all three sites share one Supabase project) and take no lock — they select unmarked
  rows, charge or send, and mark afterwards. Three schedules firing at 08:00 UTC would charge
  each customer up to three times.
- the `Sitemap:` line in `public/robots.txt` — each site points at its own domain
- git remote / Vercel project

Env vars are configured per Vercel project, not in code. Apart from the items above the three
repos are byte-identical, deliberately — a change can be moved between them as a patch
(`git diff` in one, `git apply` in the other) rather than retyped. If a file looks like it has
drifted, check whether the difference is only formatting before treating it as real: run both
versions through the shared `.prettierrc.json` and compare.

### Payments

Checkout Sessions are created in `app/actions/stripe.ts` (card or ACH; deposit via
`trips.deposit_percentage`, or full payment). `/api/stripe/webhook` handles
`checkout.session.completed` / `.expired` and is the only writer that confirms a `stripe_bookings`
row. Two Vercel Cron jobs (`vercel.json`, this repo only — see above) run daily and authenticate
with `Bearer ${CRON_SECRET}`: `/api/cron/charge-remaining-balance` (08:00 UTC) and
`/api/cron/send-payment-reminders` (09:00 UTC). Both process bookings from all three sites, so
they resolve the sender and links from each row's `site_url` (migration `053`) rather than from
their own deployment — pass it through as `getFromEmail(booking.site_url)`.
Admin-created custom bookings can be paid via a Twilio SMS link
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
