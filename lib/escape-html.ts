/**
 * Escape text before putting it inside an HTML email. Anything a visitor
 * typed (names, notes, messages) must go through this — otherwise they can
 * inject links and markup into emails that land in the admin's inbox.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** escapeHtml, then turn newlines into <br> for message bodies. */
export function escapeHtmlMultiline(value: unknown): string {
  return escapeHtml(value).replace(/\r?\n/g, '<br>')
}
