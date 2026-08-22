import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  // Get the session response from Supabase middleware
  const response = await updateSession(request)

  // Set default locale cookie if not present
  if (!request.cookies.has('NEXT_LOCALE')) {
    response.cookies.set('NEXT_LOCALE', 'ko', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    })
  }

  return response
}

export const config = {
  // `api/` is deliberately excluded: every route handler re-checks auth
  // itself (middleware only ever proved *authentication*, never the admin
  // role), and the server client can refresh the session cookie from
  // inside a route handler on its own. Leaving them in meant every Stripe
  // webhook, upload and internal translate call paid for an extra
  // function invocation plus a Supabase Auth round-trip.
  //
  // Static-ish files are excluded for the same reason — nothing to
  // authenticate, and no locale cookie worth seeding.
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|woff|woff2|ttf|otf)$).*)",
  ],
}
