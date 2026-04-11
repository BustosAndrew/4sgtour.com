import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { getUserType } from "@/lib/supabase/get-user-type"
import { NextResponse } from "next/server"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const userType = await getUserType()
    if (userType !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Use service role client for admin operations to bypass RLS
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // First delete any associated messages
    const { error: messagesError } = await adminClient
      .from("messages")
      .delete()
      .eq("inquiry_id", id)

    if (messagesError) {
      console.error("Error deleting messages:", messagesError)
      // Continue anyway - messages may not exist
    }

    // Try to delete from inquiries table first
    const { data: inquiryData, error: inquiryError } = await adminClient
      .from("inquiries")
      .delete()
      .eq("id", id)
      .select()

    if (inquiryError) {
      console.error("Error deleting from inquiries:", inquiryError)
    }

    // If not found in inquiries, try stripe_bookings table
    if (!inquiryData || inquiryData.length === 0) {
      const { data: bookingData, error: bookingError } = await adminClient
        .from("stripe_bookings")
        .delete()
        .eq("id", id)
        .select()

      if (bookingError) {
        console.error("Error deleting from stripe_bookings:", bookingError)
        return NextResponse.json(
          { error: "Failed to delete booking" },
          { status: 500 },
        )
      }

      if (!bookingData || bookingData.length === 0) {
        console.error("No inquiry or booking found for id:", id)
        return NextResponse.json(
          { error: "Inquiry not found" },
          { status: 404 },
        )
      }

      return NextResponse.json({ success: true, deleted: bookingData.length, source: "stripe_bookings" })
    }

    return NextResponse.json({ success: true, deleted: inquiryData.length, source: "inquiries" })
  } catch (error) {
    console.error("Error in inquiry delete route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
