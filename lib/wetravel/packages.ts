import { weTravelFetch } from "./client"
import type { WeTravelPackagesResponse, WeTravelOptionsResponse } from "./types"

/**
 * Fetch packages for a specific trip
 */
export async function getPackages(tripUuid: string): Promise<WeTravelPackagesResponse> {
  return weTravelFetch(`/draft_trips/${tripUuid}/packages`)
}

/**
 * Fetch options (add-ons) for a specific trip
 */
export async function getOptions(tripUuid: string): Promise<WeTravelOptionsResponse> {
  return weTravelFetch(`/draft_trips/${tripUuid}/options`)
}
