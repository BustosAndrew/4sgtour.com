import { weTravelFetch } from "./client"

export interface WeTravelTrip {
  uuid: string
  created_at: string
  trip_id: string
  url: string
  title: string
  destination: string
  start_date: string
  end_date: string
  group_min: number
  group_max: number
  currency: string
  participant_list_show_type: string
  welcome_message: string
  participant_fees: string
  listing_status: string
  published: number
  waiting_list_enabled: boolean
  can_contribute: boolean
  carbon_offset: {
    enabled: boolean
    percentage: number
    paid_by_participant: boolean
  }
}

interface WeTravelListResponse {
  data: WeTravelTrip[]
}

interface WeTravelSingleResponse {
  data: WeTravelTrip
}

/**
 * List all draft trips from WeTravel
 */
export async function listTrips(): Promise<WeTravelTrip[]> {
  const response = (await weTravelFetch("/draft_trips")) as WeTravelListResponse
  return response.data || []
}

/**
 * Get a single trip by UUID
 */
export async function getTrip(tripUuid: string): Promise<WeTravelTrip | null> {
  try {
    const response = (await weTravelFetch(`/draft_trips/${tripUuid}`)) as WeTravelSingleResponse
    return response.data || null
  } catch (error) {
    console.error(`Failed to fetch trip ${tripUuid}:`, error)
    return null
  }
}

/**
 * Create a new draft trip
 */
export async function createTrip(tripData: {
  title: string
  destination?: string
  start_date?: string
  end_date?: string
  currency?: string
}): Promise<WeTravelTrip> {
  const response = (await weTravelFetch("/draft_trips", {
    method: "POST",
    body: JSON.stringify(tripData),
  })) as WeTravelSingleResponse

  if (!response.data) {
    throw new Error("Failed to create trip")
  }

  return response.data
}

/**
 * Update an existing trip
 */
export async function updateTrip(tripUuid: string, tripData: Partial<WeTravelTrip>): Promise<WeTravelTrip> {
  const response = (await weTravelFetch(`/draft_trips/${tripUuid}`, {
    method: "PUT",
    body: JSON.stringify(tripData),
  })) as WeTravelSingleResponse

  if (!response.data) {
    throw new Error("Failed to update trip")
  }

  return response.data
}

/**
 * Delete a trip
 */
export async function deleteTrip(tripUuid: string): Promise<void> {
  await weTravelFetch(`/draft_trips/${tripUuid}`, {
    method: "DELETE",
  })
}
