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

Cron routes are the exception: they build a service-role client directly with
`@supabase/supabase-js` to bypass RLS.

### Auth & authorization

- `proxy.ts` (Next.js 16's middleware entry point, **not** `middleware.ts`) calls
  `updateSession()` from [lib/supabase/middleware.ts](lib/supabase/middleware.ts) and seeds the
  `NEXT_LOCALE` cookie.
- Middleware redirects anonymous users away from `/admin`, `/bookings`, `/dashboard`, and
  redirects signed-in users away from `/auth/login` and `/auth/sign-up`.
- Middleware only checks *authentication*. Every admin page and `/api/admin/*` route must
  re-check the role server-side:

```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/auth/login')
const userType = await getUserType()      // '@/lib/supabase/get-user-type'
if (userType !== 'admin') redirect('/')
```

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
| git remote / Vercel project | `v0-golf` | `4sgtour-de`, `4sgtour-at` |

`4sgtour-de` and `4sgtour-at` are identical to each other; they differ only in remote and
deployment. Environment variables (`NEXT_PUBLIC_APP_URL`, Stripe keys, `CRON_SECRET`, …) are set
per Vercel project, not in the code.

**Do not add `vercel.json` to the `.de`/`.at` repos** as part of a sync. The daily jobs
(`/api/cron/charge-remaining-balance`, `/api/cron/send-payment-reminders`) write to Supabase and
charge cards; running them from three deployments against a shared database would double- or
triple-charge bookings. Cron changes belong in this repo only — ask before changing that.

The `.de`/`.at` checkouts also lag on a few older non-locale commits (e.g. `metadataBase` and the
OpenGraph `url` in [app/layout.tsx](app/layout.tsx), `app/not-found.tsx`). Treat that as drift to
be fixed when you touch those files, not as intentional divergence.

#### Locale and URL rules that follow from this

- Never drop or rename a `de` message key or a `_de` database column on the assumption German is
  a secondary locale — it is the primary locale for two of the three sites.
- Absolute URLs follow `process.env.NEXT_PUBLIC_APP_URL || 'https://4sgtour.com'`. Keep that
  pattern for new links so each deployment resolves to its own domain; a bare `4sgtour.com`
  string sends `.de`/`.at` users to the wrong site. Note that `metadataBase` in
  [app/layout.tsx](app/layout.tsx) and the Resend `from:` address (`noreply@4sgtour.com`) are
  still hard-coded.
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
- [app/api/stripe/webhook/route.ts](app/api/stripe/webhook/route.ts) handles
  `checkout.session.completed` and `checkout.session.expired`, and is the only writer that
  confirms a `stripe_bookings` row. Verify signatures with `STRIPE_WEBHOOK_SECRET`.
- [app/actions/send-payment-link.ts](app/actions/send-payment-link.ts) texts a payment link via
  Twilio for admin-created custom bookings.
- Vercel Cron ([vercel.json](vercel.json)) runs daily:
  `/api/cron/charge-remaining-balance` (08:00 UTC) and `/api/cron/send-payment-reminders`
  (09:00 UTC). Both authenticate with `Bearer ${CRON_SECRET}` and use the service-role client.

### Routes

Public: `/`, `/destinations`, `/destinations/[continent]`,
`/destinations/[continent]/[destination]`, `/trips/[slug]`, `/trips/[slug]/book`,
`/package/[id]`, `/tournaments`, `/tournaments/[slug]`, `/tournaments/[slug]/[eventSlug]`,
`/tournaments/[slug]/[eventSlug]/tickets`, `/contact`, `/privacy`, `/terms`

Authenticated: `/bookings`, `/favorites`, `/auth/*`, `/checkout/custom/success`

Admin: `/admin`, `/admin/trips/new`, `/admin/trips/[id]`,
`/admin/tournaments/[id]/events/[eventId]`

API: `/api/admin/*` (trips, tournaments, inquiries, messages, custom-booking, stripe/generate,
translate-*), `/api/inquiry`, `/api/messages`, `/api/tournament-tickets`, `/api/upload`,
`/api/translate`, `/api/translate/batch`, `/api/stripe/webhook`, `/api/cron/*`

### Database

Tables in active use: `profiles`, `trips`, `trip_images`, `trip_golf_courses`,
`trip_meal_options`, `trip_transportation_options`, `trip_service_options`, `packages`,
`add_ons`, `inquiries`, `stripe_bookings`, `messages`, `favorites`, `destinations` (legacy),
`tournaments`, `tournament_events`, `tournament_event_itinerary_days`,
`tournament_event_pricing_tiers`, `tournament_event_gallery_images`.

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
and don't assume ordering is total. Schema changes require a new script *and* a matching edit to
`lib/types/database.ts`.

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
   Note the DB migration `034` renamed the role to `basic`, but the code still compares against
   `'regular'`; check the actual `profiles.user_type` values before changing either side.
3. **Only `packages` carry a price.** Golf courses, meals, transportation, and service options
   have `is_included` flags and descriptions, never prices.
4. **`trips.continent` is current; `trips.destination_id` is nullable legacy.** Filter on
   `continent`.
5. **Trip slugs append a timestamp** to avoid collisions, so they are not derivable from a title.
6. **`/api/upload` only requires authentication**, not admin — deliberate, don't "fix" it without
   asking.
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
