import { getSiteUrl } from './site-url'

/**
 * Bare domain of a site URL, e.g. `4sgtour.de`.
 *
 * Falls back to the running deployment's own domain when `siteUrl` is missing
 * or unparseable — which is what rows created before migration 053 look like.
 */
function siteDomain(siteUrl?: string | null): string {
  for (const candidate of [siteUrl, getSiteUrl()]) {
    if (!candidate) continue
    try {
      return new URL(candidate).hostname.replace(/^www\./, '')
    } catch {
      // try the next candidate
    }
  }
  return '4sgtour.com'
}

/**
 * `from:` address for transactional mail sent through Resend.
 *
 * Pass `siteUrl` when sending on behalf of a site other than the one running
 * the code — the cron jobs run only on the .com deployment but send mail for
 * bookings made on all three sites.
 *
 * IMPORTANT: Resend will reject a `from:` on a domain that isn't verified in
 * the Resend dashboard. If a new domain is added, set RESEND_FROM_EMAIL on
 * that Vercel project to a verified address until the domain is verified.
 */
export function getFromEmail(siteUrl?: string | null): string {
  if (!siteUrl && process.env.RESEND_FROM_EMAIL) {
    return process.env.RESEND_FROM_EMAIL
  }
  return `4 Seasons Golf Tour <noreply@${siteDomain(siteUrl)}>`
}

/**
 * Address that receives admin notifications, and the contact address quoted
 * in customer email. Receiving needs no Resend verification, only that the
 * mailbox exists.
 */
export function getAdminEmail(siteUrl?: string | null): string {
  if (!siteUrl && process.env.ADMIN_EMAIL) {
    return process.env.ADMIN_EMAIL
  }
  return `info@${siteDomain(siteUrl)}`
}

/**
 * Address customers are told to reply to. Falls back to the admin address.
 */
export function getSupportEmail(siteUrl?: string | null): string {
  if (!siteUrl && process.env.SUPPORT_EMAIL) {
    return process.env.SUPPORT_EMAIL
  }
  return getAdminEmail(siteUrl)
}
