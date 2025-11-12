import { weTravelFetch } from "./client"
import type { WeTravelPaymentLinkRequest, WeTravelPaymentLinkResponse } from "./types"

export async function createPaymentLink(request: WeTravelPaymentLinkRequest): Promise<WeTravelPaymentLinkResponse> {
  const response = await weTravelFetch("/payment_links?publish_immediately=true", {
    method: "POST",
    body: JSON.stringify(request),
  })

  return response
}
