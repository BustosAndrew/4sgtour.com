export type UserType = "regular" | "admin"

export type RoomType = "single" | "double"

export type BookingStatus = "pending" | "confirmed" | "cancelled"

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
  destination_id: string
  title: string
  slug: string
  description: string | null
  location: string
  price_regular: number
  duration_nights: number
  max_guests: number
  includes_breakfast: boolean
  includes_transport: boolean
  available_courses: Array<{ name: string; price: number }>
  continent: string | null
  courses_photo_url: string | null
  single_room_photo_url: string | null
  double_room_photo_url: string | null
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
  price_type: "per_participant" | "per_booking"
  availability: string
  quantity: number | null
  created_at: string
  updated_at: string
}
