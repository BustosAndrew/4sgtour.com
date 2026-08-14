/**
 * Absolute base URL of the current deployment, without a trailing slash.
 *
 * 4sgtour.com, 4sgtour.de and 4sgtour.at are three separate Vercel projects
 * running this same code, so any absolute URL has to come from the
 * environment — a hard-coded domain sends users of the other two sites
 * somewhere they never asked to go.
 *
 * `NEXT_PUBLIC_APP_URL` wins when set; `NEXT_PUBLIC_SITE_URL` is the fallback
 * that all three projects are configured with.
 */
export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://4sgtour.com'

  return url.replace(/\/+$/, '')
}
