import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PROTECTED_PREFIXES = ["/dashboard", "/bookings", "/admin"]
const AUTH_PAGE_PREFIXES = ["/auth/login", "/auth/sign-up"]

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isAuthPage(pathname: string) {
  return AUTH_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

/**
 * Does this request carry a Supabase session at all?
 *
 * Supabase stores the session in `sb-<project-ref>-auth-token` (chunked
 * into `.0`, `.1`, … when it is large). With none of those present the
 * visitor is definitively signed out, so there is nothing for
 * `getUser()` to validate or refresh — and on a public marketing site
 * that is the overwhelming majority of traffic.
 */
function hasSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith("sb-") &&
        cookie.name.includes("auth-token") &&
        // Not a session — this is the transient PKCE verifier written
        // during an OAuth round-trip.
        !cookie.name.includes("code-verifier"),
    )
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  // Skip auth check if Supabase credentials are not available
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[v0] Supabase credentials not found in middleware, skipping auth check")
    return NextResponse.next({
      request,
    })
  }

  // Signed-out fast path: no session cookie means no token to validate or
  // refresh, so skip building the client and calling the Auth API
  // entirely. The protected-route redirect still has to happen — an
  // anonymous request is exactly the case it exists for.
  if (!hasSessionCookie(request)) {
    if (isProtected(request.nextUrl.pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect unauthenticated users trying to access protected routes
  // (a stale or revoked cookie lands here rather than on the fast path).
  if (!user && isProtected(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthPage(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
