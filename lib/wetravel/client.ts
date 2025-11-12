let sdk: any = null
let wetravel: any = null

try {
  // Try to import the WeTravel SDK (only available after running npx api install)
  sdk = require("@wetravelapi/v2").default
  wetravel = sdk({ apiKey: process.env.WETRAVEL_REFRESH_TOKEN! })
} catch (error) {
  // SDK not installed yet - WeTravel features will be disabled
  console.warn('[WeTravel] SDK not installed. Run: npx api install "@wetravelapi/v2#6q19891xmfeha7jm"')
}

// Cache for access token
let accessTokenCache: { token: string; expiresAt: number } | null = null

/**
 * Get a valid access token, using cached token if still valid
 */
async function getAccessToken(): Promise<string> {
  if (!sdk || !wetravel) {
    throw new Error('WeTravel SDK not installed. Please run: npx api install "@wetravelapi/v2#6q19891xmfeha7jm"')
  }

  // Check if we have a valid cached token
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now()) {
    return accessTokenCache.token
  }

  // Issue new access token (valid for 1 hour)
  const response = await wetravel.issueAccessToken()

  if (!response.data?.access_token) {
    throw new Error("Failed to get WeTravel access token")
  }

  // Cache the token (expires in 1 hour, cache for 55 minutes to be safe)
  accessTokenCache = {
    token: response.data.access_token,
    expiresAt: Date.now() + 55 * 60 * 1000, // 55 minutes
  }

  return accessTokenCache.token
}

/**
 * Get authenticated WeTravel client with valid access token
 */
export async function getWeTravelClient() {
  const accessToken = await getAccessToken()
  return sdk({ apiKey: accessToken })
}

export { wetravel }
