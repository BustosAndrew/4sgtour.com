# 4sgtour.com — Golf Trip Booking Platform

This repository contains the source for a golf trip booking platform built with Next.js (App Router), Supabase, and TypeScript. It powers a public trip browsing experience and a protected admin dashboard for managing trips, packages, and inquiries.

Live deployment

- Vercel (project): https://vercel.com/bustosandrews-projects/v0-golf

Tech stack

- Next.js 16 (App Router, React 19)
- TypeScript (strict)
- Supabase (PostgreSQL with Row Level Security)
- Tailwind CSS v4
- Radix UI primitives for component building
- Vercel Blob for image uploads
- Resend for transactional emails

Repository structure (high level)

- app/ — Next.js App Router routes and server components
- components/ — shared UI components (Radix wrappers in components/ui/)
- lib/
  - supabase/
    - server.ts — server-side Supabase client (async createClient())
    - client.ts — client-side Supabase client (singleton for browser)
    - middleware.ts — authentication middleware for protected routes
    - get-user-type.ts — helper to read profile.user_type
  - types/database.ts — TypeScript types for Supabase tables
- scripts/ — numbered SQL migration files (apply in Supabase SQL editor)
- pages/api/ or app/api/ — API routes
  - /api/admin/trips — POST used by admin to create trips (transactional)
  - /api/inquiry — POST used by customers to submit inquiries (sends email via Resend)
  - /api/upload — POST used to upload images to Vercel Blob

Key concepts and patterns

Server vs Client components

- Default to Server Components: most UI is rendered on the server. Mark interactive or browser-only code with "use client".
- Client components must never import the server Supabase client. Use the client-only `@/lib/supabase/client` in client components.

Supabase client separation

- Server-side client: `@/lib/supabase/server`
  - Usage (server components / API routes / server actions):

```typescript
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient(); // async
```

- Client-side client: `@/lib/supabase/client`
  - Usage (browser components only):

```typescript
import { createClient } from '@/lib/supabase/client';
const supabase = createClient(); // singleton
```

Authentication & authorization

- Middleware (`lib/supabase/middleware.ts`) protects `/admin`, `/bookings`, and `/dashboard` routes.
- Profiles include a `user_type` field (values: `admin` | `regular`) used for server-side authorization checks.
- Typical auth check pattern in server code:

```typescript
const { data: { user } } await supabase.auth.getUser();
if (!user) redirect('/auth/login');
const userType = await getUserType();
if (userType !== 'admin') redirect('/');
```

Database schema (overview)

Core tables (see `scripts/*.sql` for exact schema and RLS policies):

- profiles — user metadata, includes `user_type` for role checks
- trips — trip listings (continent, title, slug, base metadata)
- packages — room/package options (ONLY packages have `price`)
- trip_golf_courses — golf course options per trip
- trip_meal_options / trip_transportation_options — add-on options
- inquiries — booking inquiries (replaces old bookings table)
- favorites — user-saved trips

Common query pattern with joins

```typescript
const { data } = await supabase.from('trips').select(`
  *,
  packages(id, name, price),
  trip_golf_courses(course_name, max_rounds, description)
`);
```

Row Level Security (RLS)

- RLS is enabled on tables. Most reads are public; writes are admin-only. Migration SQL files in `scripts/` document policies.

Admin dashboard & trip creation

- Multi-step trip creation form: `components/admin/create-trip-form.tsx` (4 steps with validation)
- Image uploads go to `/api/upload` and store images in Vercel Blob
- Trip creation endpoint `/api/admin/trips` creates trip and related packages/courses/meals/transport in a transaction

Development

Prerequisites

- Node.js 20+
- pnpm
- Supabase project for database and storage
- Vercel for deployment (optional)

Local development

1. Install dependencies

pnpm install

2. Local dev server

pnpm dev

3. Build for production

pnpm build

4. Lint

pnpm lint

Environment variables

Create a .env.local file with at minimum the following (names may vary; check `lib/supabase` and README or docs in the code for exact names):

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (only for server-side operations that require elevated privileges — keep secret)
- RESEND_API_KEY (for sending emails)
- VERCEL_BLOB_READ_KEY / VERCEL_BLOB_WRITE_KEY (if using Vercel Blob keys)
- NEXTAUTH_URL / NEXTAUTH_SECRET (if present in codebase)

Database migrations

- Schema changes are authored as SQL files in `scripts/` (e.g., `035_*.sql`) — apply them in your Supabase project's SQL editor in order.
- Migration files document schema evolution; review recent ones (notably `042` for package name changes) before altering the DB.

Testing & CI

- No automated tests are included by default. Use `pnpm lint` for static checks.

API endpoints

- POST /api/inquiry — accepts booking inquiries and sends email via Resend
- POST /api/admin/trips — admin-only endpoint to create trips and related records
- POST /api/upload — uploads images (admin-only)

Contributing

- Follow the repository conventions: prefer Server Components, use `@/lib/supabase/server` on the server and `@/lib/supabase/client` in client code.
- Place schema migrations in `scripts/` and apply manually to Supabase.

Helpful links

- App (deployed): https://vercel.com/bustosandrews-projects/v0-golf
- v0.app project editor: https://v0.app/chat/tXZzr9aQ0zz

License

- (Specify a license if applicable)
