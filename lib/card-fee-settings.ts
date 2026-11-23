import 'server-only'

import {
  CARD_FEE_SETTING_KEY,
  DEFAULT_CARD_FEE_PERCENT,
  toCardFeePercent,
} from '@/lib/booking-price'

/**
 * The default credit card fee for new trips, set at Admin → Payments
 * (app_settings, migration 062). Falls back to 4% if the setting is missing
 * or can't be read, so a missing row never blocks creating a trip.
 */
export async function getDefaultCardFeePercent(supabase: any): Promise<number> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', CARD_FEE_SETTING_KEY)
    .maybeSingle()
  if (error) {
    console.error('[card-fee] Could not read the default card fee:', error)
    return DEFAULT_CARD_FEE_PERCENT
  }
  return toCardFeePercent(data?.value)
}
