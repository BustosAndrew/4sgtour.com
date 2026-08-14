/**
 * Shared loading skeleton for the public routes.
 *
 * Beyond the obvious UX benefit, these boundaries matter for cost: a
 * `<Link>` prefetch on a dynamic route with no loading boundary makes
 * Next render the whole page on the server. The header and footer put
 * ~26 links in the viewport of every page, so without a boundary a single
 * page view can trigger a dozen extra full renders — each one a function
 * invocation running the same Supabase queries. With a loading.tsx in the
 * segment, the prefetch stops here instead.
 */

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-sm bg-[#22333b]/10 ${className}`}
      aria-hidden="true"
    />
  )
}

export function PageLoading({ variant = 'detail' }: { variant?: 'detail' | 'list' }) {
  return (
    <div className="min-h-screen bg-[#fffff8]" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>

      {/* Header stand-in */}
      <div className="border-b border-[#22333b]/10">
        <div className="container flex h-20 items-center justify-between">
          <Shimmer className="h-10 w-36" />
          <div className="hidden gap-6 md:flex">
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-4 w-20" />
          </div>
        </div>
      </div>

      {variant === 'detail' ? (
        <>
          {/* Hero stand-in */}
          <Shimmer className="h-[40vh] w-full rounded-none md:h-[55vh]" />
          <div className="container py-12">
            <Shimmer className="mb-6 h-10 w-2/3 max-w-xl" />
            <Shimmer className="mb-3 h-4 w-full max-w-3xl" />
            <Shimmer className="mb-3 h-4 w-full max-w-2xl" />
            <Shimmer className="mb-10 h-4 w-1/2 max-w-md" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Shimmer className="h-48" />
              <Shimmer className="h-48" />
              <Shimmer className="h-48" />
            </div>
          </div>
        </>
      ) : (
        <div className="container py-16">
          <Shimmer className="mx-auto mb-4 h-10 w-72" />
          <Shimmer className="mx-auto mb-12 h-4 w-96 max-w-full" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Shimmer className="mb-4 h-56 w-full" />
                <Shimmer className="mb-2 h-5 w-3/4" />
                <Shimmer className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
