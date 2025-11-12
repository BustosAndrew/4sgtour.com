import { type NextRequest, NextResponse } from "next/server"
import { createPaymentLink } from "@/lib/wetravel/payment-links"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, startDate, endDate, totalPrice, currency = "USD" } = body

    if (!title || !startDate || !endDate || !totalPrice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const paymentLinkRequest = {
      data: {
        trip: {
          title,
          start_date: startDate,
          end_date: endDate,
          currency,
          participant_fees: "all",
        },
        pricing: {
          price: totalPrice,
          days_before_departure: 0,
          payment_plan: {
            allow_auto_payment: false,
            allow_partial_payment: false,
          },
        },
      },
    }

    const response = await createPaymentLink(paymentLinkRequest)

    return NextResponse.json({
      success: true,
      paymentUrl: response.data.trip.url,
      tripUuid: response.data.trip.uuid,
    })
  } catch (error) {
    console.error("[v0] Error creating payment link:", error)
    return NextResponse.json({ error: "Failed to create payment link" }, { status: 500 })
  }
}
