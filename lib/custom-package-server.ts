import 'server-only'

import { cache } from 'react'
import { createServiceClient } from '@/lib/supabase/service'
import type {
  CustomPackageBooking,
  CustomPackageInquiry,
} from '@/lib/custom-package'

// Columns the package page and checkout route need — and nothing else, since
// these rows are read with the service role for a signed-out visitor.
const INQUIRY_COLUMNS = [
  'id',
  'trip_id',
  'trip_title',
  'site_url',
  'customer_name',
  'customer_email',
  'customer_phone',
  'start_date',
  'end_date',
  'total_price',
  'deposit_percentage',
  'remainder_due_date',
  'balance_flow',
  'status',
  'custom_package_description',
].join(', ')

const BOOKING_COLUMNS = [
  'id',
  'status',
  'total_paid',
  'remaining_balance',
  'remaining_balance_charged',
  'remaining_balance_payment_intent_id',
  'auto_charge_date',
  'stripe_customer_id',
  'stripe_payment_method_id',
].join(', ')

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type CustomPackageRow = CustomPackageInquiry & {
  trip_id: string | null
  trip_title: string | null
  site_url: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  start_date: string | null
  end_date: string | null
  custom_package_description: string | null
}

/**
 * The custom trip behind a package, with everything the page shows. Read with
 * the service role, scoped to the trip id from the inquiry.
 */
export const loadCustomTrip = cache(async (tripId: string | null) => {
  if (!tripId) return null
  const { data, error } = await createServiceClient()
    .from('trips')
    .select(
      `
      id, title, title_ko, title_de, location, location_ko, location_de,
      description, description_ko, description_de,
      overview_content, overview_content_ko, overview_content_de,
      refund_policy, refund_policy_ko, refund_policy_de,
      highlights, highlights_ko, highlights_de,
      courses_photo_url, room_photo_url,
      packages(id, name, name_ko, name_de, description, description_ko, description_de),
      trip_images(id, image_url, display_order),
      trip_golf_courses(id, course_name, course_name_ko, course_name_de, max_rounds, num_holes, description, description_ko, description_de),
      trip_meal_options(id, name, name_ko, name_de, description, description_ko, description_de, is_included),
      trip_transportation_options(id, name, name_ko, name_de, description, description_ko, description_de, is_included),
      trip_service_options(id, name, name_ko, name_de, description, description_ko, description_de, is_included)
    `,
    )
    .eq('id', tripId)
    .maybeSingle()
  if (error) console.error('[custom-package] Error loading trip:', error)
  return data as any
})

/**
 * Load a custom-package inquiry and the payments recorded against it.
 * Returns null for anything that isn't a custom package. Cached per request
 * so generateMetadata and the page share one read.
 */
export const loadCustomPackage = cache(async (id: string) => {
  if (!UUID.test(id)) return null
  const supabase = createServiceClient()

  const { data: inquiry, error } = await supabase
    .from('inquiries')
    .select(INQUIRY_COLUMNS)
    .eq('id', id)
    .eq('is_custom_package', true)
    .maybeSingle()

  if (error) {
    console.error('[custom-package] Error loading inquiry:', error)
    return null
  }
  if (!inquiry) return null

  const { data: bookings, error: bookingsError } = await supabase
    .from('stripe_bookings')
    .select(BOOKING_COLUMNS)
    .eq('inquiry_id', id)

  if (bookingsError) {
    // Most likely migration 058 hasn't been applied yet.
    console.error('[custom-package] Error loading payments:', bookingsError)
  }

  return {
    inquiry: inquiry as unknown as CustomPackageRow,
    bookings: (bookings || []) as unknown as CustomPackageBooking[],
  }
})
