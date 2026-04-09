import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import Twilio from "twilio"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify admin auth
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      packageName,
      packageDescription,
      totalPrice,
      customerName,
      customerEmail,
      customerPhone,
      startDate,
      endDate,
      depositPercentage,
      remainderDueDate,
    } = body

    // Validate required fields
    if (!packageName || !totalPrice || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Calculate deposit amount in cents
    const depositAmount = Math.round((totalPrice * depositPercentage) / 100 * 100)
    const depositAmountDollars = depositAmount / 100

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://4sgtour.com"

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${packageName} (${depositPercentage === 100 ? "Full Payment" : `${depositPercentage}% Deposit`})`,
              description: packageDescription || `Custom package for ${customerName}`,
            },
            unit_amount: depositAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/bookings?success=true`,
      cancel_url: `${appUrl}/trips`,
      customer_email: customerEmail,
      payment_method_types: ["card", "us_bank_account"],
      metadata: {
        is_custom_package: "true",
        custom_package_name: packageName,
        custom_package_description: packageDescription || "",
        total_price: totalPrice.toString(),
        deposit_percentage: depositPercentage.toString(),
        remainder_due_date: remainderDueDate || "",
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        start_date: startDate || "",
        end_date: endDate || "",
        created_by_admin: user.id,
        payment_method: "sms_link",
      },
      expires_at: Math.floor(Date.now() / 1000) + 86400 * 3, // Expires in 3 days
    })

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create payment link" },
        { status: 500 }
      )
    }

    // Create inquiry record for custom package
    const { error: inquiryError } = await supabase.from("inquiries").insert({
      trip_id: null, // No trip associated with custom packages
      trip_title: packageName,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      package_name: "Custom Package",
      start_date: startDate ? new Date(startDate).toISOString().split("T")[0] : null,
      end_date: endDate ? new Date(endDate).toISOString().split("T")[0] : null,
      add_ons: [],
      rounds: 0,
      additional_requests: packageDescription || "",
      total_price: totalPrice,
      guests: [],
      status: "contacted",
      payment_link: session.url,
      stripe_session_id: session.id,
      payment_link_sent_at: new Date().toISOString(),
      is_custom_package: true,
      custom_package_description: packageDescription || "",
      remainder_due_date: remainderDueDate
        ? new Date(remainderDueDate).toISOString().split("T")[0]
        : null,
      deposit_percentage: depositPercentage,
    })

    if (inquiryError) {
      console.error("[v0] Error creating inquiry for custom booking:", inquiryError)
      // Continue anyway - the Stripe session was created successfully
    }

    // Send SMS via Twilio
    try {
      const twilioClient = Twilio(
        process.env.TWILIO_ACCOUNT_SID!,
        process.env.TWILIO_AUTH_TOKEN!
      )

      const paymentDescription =
        depositPercentage === 100
          ? `full payment ($${totalPrice.toFixed(2)})`
          : `${depositPercentage}% deposit ($${depositAmountDollars.toFixed(2)})`

      await twilioClient.messages.create({
        to: customerPhone,
        from: process.env.TWILIO_PHONE_NUMBER!,
        body: `4 Seasons Golf Tour: Your payment link for ${packageName} is ready. Complete your ${paymentDescription} here: ${session.url} Reply STOP to opt out.`,
      })
    } catch (smsError) {
      console.error("[v0] Error sending SMS:", smsError)
      // Don't fail the whole request if SMS fails - the payment link was created
    }

    return NextResponse.json({
      success: true,
      paymentLink: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error("[v0] Error creating custom booking:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create custom booking" },
      { status: 500 }
    )
  }
}
