export type UserType = 'regular' | 'admin'

export type RoomType = 'single' | 'double'

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'

export interface Profile {
  id: string
  email: string
  display_name: string | null
  user_type: UserType
  created_at: string
  updated_at: string
}

export interface Destination {
  id: string
  name: string
  slug: string
  description: string | null
  continent: string
  country: string
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface Trip {
  id: string
  destination_id: string | null
  title: string
  slug: string
  description: string | null
  location: string
  price_regular: number
  max_guests: number
  max_days: number | null
  min_days: number
  min_days_advance: number
  highlights: string[] | null
  overview_content: string | null
  refund_policy: string | null
  continent: string | null
  courses_photo_url: string | null
  room_photo_url: string | null
  show_from_price: boolean
  is_custom: boolean
  deposit_percentage: number | null
  created_at: string
  updated_at: string
}

export interface TripImage {
  id: string
  trip_id: string
  image_url: string
  display_order: number
  created_at: string
}

export interface Booking {
  id: string
  user_id: string
  trip_id: string
  start_date: string
  end_date: string
  num_guests: number
  room_type: RoomType
  selected_courses: Array<{ name: string; price: number }>
  num_rounds: number
  includes_breakfast: boolean
  includes_transport: boolean
  additional_requests: string | null
  total_price: number
  status: BookingStatus
  created_at: string
  updated_at: string
}

export interface Favorite {
  id: string
  user_id: string
  trip_id: string
  created_at: string
}

export interface Package {
  id: string
  trip_id: string
  name: string
  description: string | null
  price: number
  availability: string
  quantity: number | null
  participants_per_booking: number
  created_at: string
  updated_at: string
}

export interface AddOn {
  id: string
  trip_id: string
  name: string
  description: string | null
  price: number
  price_type: 'per_participant' | 'per_booking'
  availability: string
  quantity: number | null
  created_at: string
  updated_at: string
}

export interface Inquiry {
  id: string
  /** Origin site, e.g. https://4sgtour.de. Null for rows predating migration 053. */
  site_url: string | null
  trip_id: string | null
  trip_title: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  package_name: string | null
  start_date: string | null
  end_date: string | null
  add_ons: string[] | null
  rounds: number
  additional_requests: string | null
  total_price: number
  status: 'pending' | 'contacted' | 'converted' | 'cancelled'
  guests: Array<{
    name: string
    phone: string
    occupancy: 'single' | 'double'
  }> | null
  payment_link: string | null
  stripe_session_id: string | null
  payment_link_sent_at: string | null
  is_custom_package: boolean | null
  custom_package_description: string | null
  deposit_percentage: number | null
  remainder_due_date: string | null
  payment_reminder_sent_at: string | null
  created_at: string
  updated_at: string
}

export interface StripeBooking {
  id: string
  /** Origin site, e.g. https://4sgtour.de. Null for rows predating migration 053. */
  site_url: string | null
  trip_id: string | null
  package_id: string | null
  user_id: string | null
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  customer_name: string
  customer_email: string
  customer_phone: string | null
  payment_method: 'card' | 'us_bank_account' | 'sms_link' | null
  deposit_amount: number
  processing_fee: number
  total_paid: number
  total_package_price: number
  total_price: number
  trip_title: string | null
  booking_details: Record<string, unknown> | null
  status:
    | 'pending'
    | 'confirmed'
    | 'completed'
    | 'failed'
    | 'refunded'
    | 'expired'
  trip_start_date: string | null
  remaining_balance: number
  auto_charge_date: string | null
  stripe_customer_id: string | null
  stripe_payment_method_id: string | null
  remaining_balance_charged: boolean
  remaining_balance_charged_at: string | null
  remaining_balance_payment_intent_id: string | null
  deposit_percentage: number | null
  remainder_due_date: string | null
  remainder_payment_link: string | null
  payment_reminder_sent_at: string | null
  created_at: string
  updated_at: string
}
