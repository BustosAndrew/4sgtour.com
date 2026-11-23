import 'server-only'

import { getLocalizedField } from '@/lib/i18n/get-localized-field'
import { getServerLocale } from '@/lib/i18n/server'
import {
  calculateBookingTotal,
  getDepositPercentage,
  nightsBetween,
  toCents,
  type CheckoutErrorCode,
  type Occupancy,
} from '@/lib/booking-price'

export interface BookingPriceInput {
  packageId: string
  tripId: string
  startDate: string
  endDate: string
  /** 'Single Occupancy' | 'Double Occupancy', as the booking form sends it */
  roomType: string
  guests?: Array<{ occupancy?: string }>
  /** What the customer was shown. Used only to detect a mismatch. */
  totalPrice: number
  depositPercentage?: number
}

export interface ResolvedBookingPrice {
  totalPrice: number
  depositPercentage: number
  /** Built from the database row, e.g. "Premium - Double Occupancy" */
  packageName: string
}

/**
 * Thrown when a booking can't be priced or the browser's price disagrees with
 * the database. Next.js strips thrown error messages from server actions in
 * production, so the actions catch this and return `code` as data; the
 * payment screen turns it into translated copy.
 */
export class BookingPriceError extends Error {
  constructor(
    public readonly code: CheckoutErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'BookingPriceError'
  }
}

/**
 * Recompute a standard trip booking's price from the database.
 *
 * Server actions are public endpoints, so nothing that decides what a
 * customer is charged may come from the browser. This also pins the package
 * name to the package actually being charged.
 */
export async function resolveBookingPrice(
  supabase: any,
  input: BookingPriceInput,
): Promise<ResolvedBookingPrice> {
  const { data: pkg } = await supabase
    .from('packages')
    .select('id, trip_id, name, name_ko, name_de, price, price_per_extra_night')
    .eq('id', input.packageId)
    .maybeSingle()

  if (!pkg || pkg.trip_id !== input.tripId) {
    throw new BookingPriceError(
      'PACKAGE_UNAVAILABLE',
      `Package ${input.packageId} not found on trip ${input.tripId}`,
    )
  }

  const { data: trip } = await supabase
    .from('trips')
    .select(
      'id, is_custom, min_nights, min_days, deposit_percentage, single_occupancy_surcharge',
    )
    .eq('id', input.tripId)
    .maybeSingle()

  // Custom trips are private per-customer itineraries paid through admin
  // links, never through the public booking form.
  if (!trip || trip.is_custom) {
    throw new BookingPriceError(
      'TRIP_UNAVAILABLE',
      `Trip ${input.tripId} missing or custom`,
    )
  }

  const nights = nightsBetween(input.startDate, input.endDate)
  if (nights === null || nights <= 0) {
    throw new BookingPriceError(
      'INVALID_DATES',
      `Invalid dates ${input.startDate}..${input.endDate}`,
    )
  }

  const toOccupancy = (value?: string): Occupancy =>
    value === 'single' || value === 'Single Occupancy' ? 'single' : 'double'
  const primaryOccupancy = toOccupancy(input.roomType)
  const occupancies: Occupancy[] = [
    primaryOccupancy,
    ...(Array.isArray(input.guests) ? input.guests : []).map((guest) =>
      toOccupancy(guest?.occupancy),
    ),
  ]

  const totalPrice = calculateBookingTotal(pkg, trip, nights, occupancies)
  const depositPercentage = getDepositPercentage(trip)

  if (
    toCents(totalPrice) !== toCents(Number(input.totalPrice)) ||
    (input.depositPercentage !== undefined &&
      Number(input.depositPercentage) !== depositPercentage)
  ) {
    console.error('[booking-price] Client price mismatch', {
      packageId: input.packageId,
      tripId: input.tripId,
      clientTotal: input.totalPrice,
      serverTotal: totalPrice,
      clientDeposit: input.depositPercentage,
      serverDeposit: depositPercentage,
    })
    throw new BookingPriceError(
      'PRICE_CHANGED',
      `Client total ${input.totalPrice} != server total ${totalPrice}`,
    )
  }

  const locale = await getServerLocale()
  const localizedName =
    (getLocalizedField(pkg, 'name', locale) as string) || pkg.name
  const roomLabel =
    primaryOccupancy === 'single' ? 'Single Occupancy' : 'Double Occupancy'

  return {
    totalPrice,
    depositPercentage,
    packageName: `${localizedName} - ${roomLabel}`,
  }
}
