# 4sgtour.com — 4 Seasons Golf Tour

Golf trip booking platform built with Next.js 16 (App Router), Supabase, and TypeScript. It powers
a public browsing and booking experience — destinations, trips, and tournament events — with
Stripe checkout, and a protected admin dashboard for managing trips, tournaments, inquiries, and
customer messages.

## Deployments

| Site | Default language |
| --- | --- |
| https://4sgtour.com | English |
| https://4sgtour.de (Germany branch) | German |
| https://4sgtour.at (Austria branch) | German |

The `.de` and `.at` branch sites are separate deployments of the same product with `de` as their
default locale. This repository has no domain-conditional logic — see
[CLAUDE.md](CLAUDE.md#sister-sites-4sgtourde--4sgtourat) before changing locale defaults or
message keys.

## Tech stack

- Next.js 16 (App Router) + React 19, TypeScript strict
- Supabase — Postgres, Auth, Row Level Security (`@supabase/ssr`)
- Tailwind CSS v4 + shadcn/ui over Radix primitives
- Stripe (checkout, webhooks, scheduled balance charges)
- Resend (transactional email), Twilio (SMS payment links)
- Vercel Blob (image uploads), Vercel Analytics, Vercel Cron
- AI SDK v6 via the Vercel AI Gateway (content translation)
- `next-intl` message files for UI copy across `en` / `ko` / `de`

## Getting started

Prerequisites: Node.js 20+, pnpm, a Supabase project, and a Stripe account.

```powershell
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # production build (also the type-check gate)
pnpm start    # serve the production build
```

There are no automated tests. `pnpm lint` is declared in `package.json` but is currently
non-functional — eslint is not a dependency and there is no `eslint.config.*`. Use `pnpm build`
or `npx tsc --noEmit` to validate changes.

### Environment variables

Create `.env.local` (all `.env*` files are gitignored):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (required) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (required) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role for cron jobs — server only, keep secret |
| `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` | Absolute URLs in emails and Stripe redirects |
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` | Local auth callback override |
| `STRIPE_SECRET_KEY` | Stripe server key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client key |
| `STRIPE_WEBHOOK_SECRET` | Verifies `/api/stripe/webhook` signatures |
| `RESEND_API_KEY` | Transactional email |
| `ADMIN_EMAIL` / `SUPPORT_EMAIL` | Inquiry and support recipients |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | SMS payment links |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob uploads |
| `CRON_SECRET` | Authenticates Vercel Cron requests |

AI Gateway credentials are provided by Vercel at runtime; no key is read from `process.env` for
translation.

## Repository structure

```
app/            App Router routes, API route handlers, and Server Actions
  actions/      Server Actions (Stripe checkout, SMS payment links, locale)
  admin/        Admin dashboard (trips, tournaments, events)
  api/          Route handlers — admin, stripe, cron, inquiry, messages, translate, upload
components/     Shared components; admin/ for dashboard UI, ui/ for shadcn primitives
hooks/          Client hooks
lib/
  supabase/     server.ts, client.ts, middleware.ts, get-user-type.ts
  i18n/         locale config, server helpers, client provider, getLocalizedField
  types/        hand-written database row types
  stripe.ts     server-only Stripe instance
  auto-translate.ts, run-with-concurrency.ts, continents.ts, tournament-data.ts
messages/       en.json, ko.json, de.json — UI copy
scripts/        numbered SQL migrations, applied by hand in the Supabase SQL editor
proxy.ts        Next.js 16 middleware entry — auth session refresh + locale cookie
vercel.json     Vercel Cron schedules
```

## Key concepts

### Server vs client components

Server Components are the default and query Supabase directly. Mark interactive or browser-only
code `"use client"`. Client components must never import the server Supabase client.

```typescript
// Server Components, Route Handlers, Server Actions
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()   // async

// Client Components only
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()          // browser singleton
```

### Authentication and authorization

`proxy.ts` refreshes the Supabase session and protects `/admin`, `/bookings`, and `/dashboard`
from anonymous users. Role checks are **not** done in middleware — every admin page and
`/api/admin/*` route re-checks `profiles.user_type` server-side via
`getUserType()` from `@/lib/supabase/get-user-type`.

### Internationalization

Locale (`en` / `ko` / `de`) is chosen by the `NEXT_LOCALE` cookie; there are no `/[locale]` route
segments. UI copy lives in `messages/*.json`. Database content is translated into suffixed columns
on the same row (`title`, `title_ko`, `title_de`) and must be read through
`getLocalizedField(row, 'title', locale)`, which falls back to the English column. Admin
create/update routes call the helpers in `lib/auto-translate.ts` to fill translations via the AI
Gateway.

### Payments

Stripe Checkout Sessions are created in Server Actions (`app/actions/stripe.ts`) and support card
or ACH, deposit (`trips.deposit_percentage`) or full payment. `/api/stripe/webhook` is the only
writer that confirms a `stripe_bookings` row. Two Vercel Cron jobs run daily: remaining-balance
auto-charges (08:00 UTC) and payment reminders (09:00 UTC).

### Database

Core tables: `profiles`, `trips` (plus `trip_images`, `trip_golf_courses`, `trip_meal_options`,
`trip_transportation_options`, `trip_service_options`), `packages`, `add_ons`, `inquiries`,
`stripe_bookings`, `messages`, `favorites`, and the tournament tables (`tournaments`,
`tournament_events`, `tournament_event_itinerary_days`, `tournament_event_pricing_tiers`,
`tournament_event_gallery_images`). `destinations` is legacy.

Only `packages` carry a price — golf courses, meals, transportation, and service options have
descriptions and `is_included` flags. RLS is enabled everywhere: reads are mostly public, writes
are admin-only.

Fetch related data with nested selects:

```typescript
const { data } = await supabase.from('trips').select(`
  *,
  packages(id, name, price),
  trip_golf_courses(course_name, max_rounds, description)
`)
```

### Migrations

Schema changes are numbered SQL files in `scripts/`, applied manually in the Supabase SQL editor —
there is no migration runner. Numbers have collided historically, so pick the next unused one.
Every schema change also needs a matching update to `lib/types/database.ts`, which is hand-written
rather than generated.

## Routes

**Public** — `/`, `/destinations`, `/destinations/[continent]`,
`/destinations/[continent]/[destination]`, `/trips/[slug]`, `/trips/[slug]/book`, `/package/[id]`,
`/tournaments`, `/tournaments/[slug]`, `/tournaments/[slug]/[eventSlug]`,
`/tournaments/[slug]/[eventSlug]/tickets`, `/contact`, `/privacy`, `/terms`

**Authenticated** — `/bookings`, `/favorites`, `/auth/*`, `/checkout/custom/success`

**Admin** — `/admin`, `/admin/trips/new`, `/admin/trips/[id]`,
`/admin/tournaments/[id]/events/[eventId]`

**API** — `/api/admin/*`, `/api/inquiry`, `/api/messages`, `/api/tournament-tickets`,
`/api/upload`, `/api/translate`, `/api/translate/batch`, `/api/stripe/webhook`, `/api/cron/*`

## Contributing

- Prefer Server Components; use `@/lib/supabase/server` on the server and
  `@/lib/supabase/client` in client code.
- Formatting follows `.prettierrc.json` (no semicolons, single quotes, 80 columns); match the
  surrounding file where older code differs.
- Adding a trip or tournament field means touching three places: the create form, the edit form
  (both in `components/admin/`), and the corresponding API route handler.
- Put schema changes in `scripts/` and apply them to Supabase manually.
- New remote image hosts go in `remotePatterns` in `next.config.js`, and any non-default `quality`
  value must be listed in `images.qualities`.

See [CLAUDE.md](CLAUDE.md) for the full working guide, including known gotchas.

## Links

- Vercel project: https://vercel.com/bustosandrews-projects/v0-golf
- v0.app project editor: https://v0.app/chat/tXZzr9aQ0zz
