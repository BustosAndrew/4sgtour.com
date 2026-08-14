import { getSiteUrl } from './site-url'

/**
 * Bare domain of the current deployment, e.g. `4sgtour.de`.
 */
function siteDomain(): string {
  try {
    return new URL(getSiteUrl()).hostname.replace(/^www\./, '')
  } catch {
    return '4sgtour.com'
  }
}

/**
 * `from:` address for transactional mail sent through Resend.
 *
 * Defaults to `noreply@<this site's domain>` so the German and Austrian
 * deployments don't sign their mail as 4sgtour.com.
 *
 * IMPORTANT: Resend will reject a `from:` on a domain that isn't verified in
 * the Resend dashboard. If 4sgtour.de / 4sgtour.at are not verified there,
 * set RESEND_FROM_EMAIL on those Vercel projects to a verified address.
 */
export function getFromEmail(): string {
  return (
    process.env.RESEND_FROM_EMAIL ||
    `4 Seasons Golf Tour <noreply@${siteDomain()}>`
  )
}

/**
 * Address that receives admin notifications, and the contact address quoted
 * in customer email. Receiving needs no Resend verification, only that the
 * mailbox exists.
 */
export function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL || `info@${siteDomain()}`
}

/**
 * Address customers are told to reply to. Falls back to the admin address.
 */
export function getSupportEmail(): string {
  return process.env.SUPPORT_EMAIL || getAdminEmail()
}
