// Cache for access token
let accessTokenCache: { token: string; expiresAt: number } | null = null

const WETRAVEL_API_BASE = "https://api.wetravel.com/v2"

/**
 * Get a valid access token, using cached token if still valid
 */
async function getAccessToken(): Promise<string> {
  const refreshToken = process.env.WETRAVEL_REFRESH_TOKEN

  if (!refreshToken) {
    throw new Error("WETRAVEL_REFRESH_TOKEN environment variable is not set")
  }

  // Check if we have a valid cached token
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now()) {
    return accessTokenCache.token
  }

  // Issue new access token (valid for 1 hour)
  const response = await fetch(`${WETRAVEL_API_BASE}/auth/tokens/access`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to get WeTravel access token: ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.access_token) {
    throw new Error("WeTravel API did not return an access token")
  }

  // Cache the token (expires in 1 hour, cache for 55 minutes to be safe)
  accessTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + 55 * 60 * 1000, // 55 minutes
  }

  return accessTokenCache.token
}

/**
 * Make an authenticated request to the WeTravel API
 */
export async function weTravelFetch(endpoint: string, options: RequestInit = {}) {
  const accessToken = await getAccessToken()

  const response = await fetch(`${WETRAVEL_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`WeTravel API error: ${response.statusText} - ${error}`)
  }

  return response.json()
}
