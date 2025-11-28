# Golf Trip Booking Platform - AI Agent Instructions

## Architecture Overview

This is a Next.js 16 (App Router) golf trip booking platform with Supabase backend, featuring a public-facing trip browsing experience and a protected admin dashboard. The app uses React Server Components by default with selective client components.

**Key Stack:**

- Next.js 16 with App Router (React 19)
- Supabase (PostgreSQL with Row Level Security)
- TypeScript with strict mode, `ignoreBuildErrors: true` in next.config
- Tailwind CSS v4 with Radix UI components
- Path alias: `@/*` maps to project root

## Critical Patterns

### Server vs Client Components

- **Default to Server Components** - all pages/components are server-rendered unless marked `"use client"`
- **Client components** (`"use client"`) are used for:
  - Interactive UI (carousels, forms, buttons with state)
  - Browser-only features (favorites, navigation)
  - All Radix UI wrapper components in `components/ui/`
- Server components can directly query Supabase using `createClient()` from `@/lib/supabase/server`
- Never import server-side Supabase client in client components

### Supabase Client Architecture

**TWO separate client implementations - never mix them:**

1. **Server-side:** `@/lib/supabase/server` - for Server Components, API routes, Server Actions

   \`\`\`typescript
   import { createClient } from '@/lib/supabase/server';
   const supabase = await createClient(); // Note: async
   \`\`\`

2. **Client-side:** `@/lib/supabase/client` - for Client Components only
   \`\`\`typescript
   import { createClient } from '@/lib/supabase/client';
   const supabase = createClient(); // Singleton pattern
   \`\`\`

### Authentication & Authorization

- **Auth flow:** Middleware (`lib/supabase/middleware.ts`) redirects unauthenticated users from `/admin`, `/bookings`, `/dashboard`
- **User roles:** "admin" | "regular" stored in `profiles.user_type`
- **Auth check pattern:**

  \`\`\`typescript
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const userType = await getUserType(); // from @/lib/supabase/get-user-type
  if (userType !== 'admin') redirect('/');
  \`\`\`

### Database Schema & Relationships

**Core tables:**

- `profiles` - user metadata, user_type field for authorization
- `trips` - golf trip listings with continent, pricing, photos (courses/rooms)
- `packages` - room type packages (Basic/Premium) linked to trips
- `trip_golf_courses` - golf course options per trip (name, price, max_rounds)
- `trip_meal_options` / `trip_transportation_options` - booking add-ons
- `inquiries` - customer booking inquiries (replaces old `bookings` table)
- `favorites` - user-saved trips

**Query pattern with joins:**

\`\`\`typescript
const { data } = await supabase.from('trips').select(`
    *,
    packages(id, name, price),
    trip_golf_courses(course_name, price_per_round, max_rounds)
  `);
\`\`\`

**RLS (Row Level Security):** All tables have RLS enabled. Most are public-readable, admin-only writable. Check `scripts/*.sql` for policies.

## Development Workflow

### Running the App

\`\`\`powershell
pnpm dev         # Start dev server (default port 3000)
pnpm build       # Production build
pnpm lint        # ESLint check
\`\`\`

### Database Migrations

- **All schema changes** go in numbered SQL files in `scripts/` (e.g., `035_*.sql`)
- Execute migrations manually in Supabase SQL Editor
- Migration files document the schema evolution - review recent ones for current structure
- Notable: Package names changed from "Regular" to "Basic" (script 034)

### Admin Dashboard

- Multi-step trip creation form (`components/admin/create-trip-form.tsx`) - 4 steps with validation
- Photo uploads use `/api/upload` route → Vercel Blob storage
- Trip creation sends to `/api/admin/trips` (POST) - creates trip + related packages/courses/meals/transport in transaction

## Common Patterns & Conventions

### Styling

- **Font:** Playfair Display (serif) used throughout for brand consistency
- **Custom components:** `AnimatedButton` (color sweep hover effect), `AnimatedHr` (expanding line)
- All UI components from `components/ui/` built on Radix primitives
- Tailwind utility-first with custom animations via `tailwindcss-animate`

### URL Structure

- `/` - Homepage with featured trips
- `/destinations` - Browse by continent
- `/destinations/[continent]` - Trips filtered by continent
- `/trips/[slug]` - Trip detail page (slug generated from title + timestamp)
- `/admin` - Admin dashboard (protected route)
- `/bookings` - User's inquiry history

### Type Definitions

- `lib/types/database.ts` - all Supabase table types
- Key types: `Trip`, `Profile`, `Package`, `UserType`, `BookingStatus`

### API Routes

- `/api/admin/trips` - POST to create trip (admin-only)
- `/api/inquiry` - POST to submit booking inquiry (sends email via Resend)
- `/api/upload` - POST for image uploads (admin-only, returns Vercel Blob URL)

### External Integrations

**Resend (Email Service):**

- Used in `/api/inquiry` to send booking inquiry notifications to admin
- Requires `RESEND_API_KEY` and `ADMIN_EMAIL` environment variables
- Email sent from "Golf Trips <noreply@yourdomain.com>" to admin
- Plain text format with inquiry details (customer info, booking details, pricing)

**Twilio Verify (Phone Authentication):**

- Integrated via Supabase Auth for phone verification during signup
- Two-step signup flow in `components/auth/sign-up-form.tsx`:
  1. User enters name, email, password, and phone number
  2. Supabase sends OTP via SMS (using Twilio Verify under the hood)
  3. User verifies phone with 6-digit code
  4. Account created with `phone_verified: true` in user metadata
- Phone format: E.164 format required (e.g., +12345678900)
- Auth flow: `signInWithOtp` → `verifyOtp` → `signUp` with verified phone
- Configured in Supabase dashboard (Phone Auth providers)

## Environment Variables

Required for production:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `RESEND_API_KEY` - Resend API key for email notifications
- `ADMIN_EMAIL` - Email address to receive booking inquiries
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token (for image uploads)

## Important Gotchas

1. **TypeScript errors ignored in build** - `ignoreBuildErrors: true` allows deployment with type errors
2. **Slug uniqueness** - trip slugs append timestamp to prevent collisions
3. **Package names** - use "Basic" not "Regular" (renamed in script 034)
4. **Image optimization disabled** - `images: { unoptimized: true }` in next.config
5. **Auth in API routes** - always check `user` AND `userType` for admin endpoints
6. **Continent field** - trips have both `destination_id` (nullable, legacy) and `continent` (text field, current)
7. **Pricing** - trip_card displays minimum package price if multiple packages exist
8. **Email from address** - Currently hardcoded as "noreply@yourdomain.com", needs domain verification in Resend

## File Organization

- `app/` - Next.js pages & API routes (App Router)
- `components/` - React components (shared + feature-specific)
  - `admin/` - admin dashboard components
  - `ui/` - Radix UI wrappers (all client components)
- `lib/` - utilities, Supabase clients, type definitions
- `scripts/` - database migration SQL files (numbered sequence)
- `public/images/` - static assets

## When Editing

- **Adding database fields:** Create new numbered SQL script, update TypeScript types in `lib/types/database.ts`
- **New admin features:** Check `getUserType()` and RLS policies, add API route in `app/api/admin/`
- **New UI components:** Follow Radix pattern in `components/ui/`, mark `"use client"` if interactive
- **Trip data changes:** Update both create/edit forms in `components/admin/` AND the API route handler
