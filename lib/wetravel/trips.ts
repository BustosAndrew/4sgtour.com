import { getWeTravelClient } from "./client"

export interface WeTravelTrip {
  uuid: string
  name: string
  description?: string
  start_date?: string
  end_date?: string
  price?: number
  currency?: string
  // Add more fields based on WeTravel API response
}

/**
 * List all trips from WeTravel
 */
export async function listTrips(): Promise<WeTravelTrip[]> {
  const client = await getWeTravelClient()
  const response = await client.getTrips()
  return response.data?.trips || []
}

/**
 * Get a single trip by UUID
 */
export async function getTrip(tripUuid: string): Promise<WeTravelTrip | null> {
  const client = await getWeTravelClient()
  const response = await client.getTrip({ trip_uuid: tripUuid })
  return response.data || null
}

/**
 * Create a new draft trip
 */
export async function createTrip(tripData: {
  name: string
  description?: string
  start_date?: string
  end_date?: string
  price?: number
  currency?: string
}): Promise<WeTravelTrip> {
  const client = await getWeTravelClient()
  const response = await client.createDraftTrip(tripData)

  if (!response.data) {
    throw new Error("Failed to create trip")
  }

  return response.data
}

/**
 * Update an existing trip
 */
export async function updateTrip(tripUuid: string, tripData: Partial<WeTravelTrip>): Promise<WeTravelTrip> {
  const client = await getWeTravelClient()
  const response = await client.updateDraftTrip({
    trip_uuid: tripUuid,
    ...tripData,
  })

  if (!response.data) {
    throw new Error("Failed to update trip")
  }

  return response.data
}

/**
 * Delete a trip
 */
export async function deleteTrip(tripUuid: string): Promise<void> {
  const client = await getWeTravelClient()
  await client.deleteDraftTrip({ trip_uuid: tripUuid })
}
