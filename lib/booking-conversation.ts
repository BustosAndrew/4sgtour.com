import 'server-only'

// Message threads belong to an inquiry (messages.inquiry_id → inquiries).
// Paid bookings live in stripe_bookings, and Admin → Inquiries / the inbox
// list them by their booking id — so messaging a booking used to fail. This
// maps any id the UI has to the inquiry that holds the conversation:
//
//   an inquiry id          → itself
//   a booking id           → its custom-package inquiry (stripe_bookings.inquiry_id),
//                            or the inquiry written with the same Stripe session
//                            (the SMS payment link writes both), or — when
//                            `create` is set — a new inquiry for the booking.
//
// Runs with the caller's own (cookie-bound) client, so RLS decides what each
// side can reach: an admin any booking, a customer only their own.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/

export async function resolveConversationInquiryId(
  supabase: any,
  id: string,
  { create }: { create: boolean },
): Promise<string | null> {
  if (!UUID.test(id)) return null

  const { data: inquiry } = await supabase
    .from('inquiries')
    .select('id')
    .eq('id', id)
    .maybeSingle()
  if (inquiry) return inquiry.id

  const { data: booking } = await supabase
    .from('stripe_bookings')
    .select(
      'id, inquiry_id, stripe_checkout_session_id, trip_id, trip_title, booking_details, customer_name, customer_email, customer_phone, site_url, trip_start_date, total_price',
    )
    .eq('id', id)
    .maybeSingle()
  if (!booking) return null

  if (booking.inquiry_id) return booking.inquiry_id

  if (booking.stripe_checkout_session_id) {
    const { data: linked } = await supabase
      .from('inquiries')
      .select('id')
      .eq('stripe_session_id', booking.stripe_checkout_session_id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (linked) return linked.id
  }

  if (!create) return null

  // Start the conversation: an inquiry carrying the booking's details,
  // linked by its Stripe session (so /bookings and Admin → Inquiries show
  // it on the booking instead of as a separate item).
  const details = (booking.booking_details || {}) as Record<string, any>
  const date = (value: unknown) =>
    typeof value === 'string' && CALENDAR_DATE.test(value) ? value : null
  const newId = crypto.randomUUID()
  const { error } = await supabase.from('inquiries').insert({
    id: newId,
    site_url: booking.site_url,
    trip_id: booking.trip_id,
    trip_title: details.trip_title || booking.trip_title || 'Booking',
    customer_name: booking.customer_name || 'Customer',
    customer_email: booking.customer_email || '',
    customer_phone: booking.customer_phone,
    package_name: details.package_name || null,
    start_date: date(details.start_date) || date(booking.trip_start_date),
    end_date: date(details.end_date),
    add_ons: [],
    rounds: 0,
    total_price: booking.total_price || 0,
    guests: [],
    status: 'converted',
    stripe_session_id: booking.stripe_checkout_session_id,
  })
  if (error) {
    console.error('[messages] Could not start a conversation for booking', id, error)
    return null
  }
  return newId
}
