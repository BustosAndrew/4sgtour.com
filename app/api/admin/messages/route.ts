import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userType = await getUserType()

  if (userType !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    // Get all inquiries with their latest message
    const { data: inquiries, error: inquiriesError } = await supabase
      .from("inquiries")
      .select("*")
      .order("updated_at", { ascending: false })

    if (inquiriesError) {
      throw inquiriesError
    }

    // Get message counts for each inquiry
    const inquiriesWithMessages = await Promise.all(
      inquiries.map(async (inquiry) => {
        const { data: messages, error: messagesError } = await supabase
          .from("messages")
          .select("*")
          .eq("inquiry_id", inquiry.id)
          .order("created_at", { ascending: false })

        if (messagesError) {
          console.error("Error fetching messages:", messagesError)
          return { ...inquiry, messageCount: 0, lastMessage: null }
        }

        return {
          ...inquiry,
          messageCount: messages.length,
          lastMessage: messages[0] || null,
        }
      }),
    )

    return NextResponse.json(inquiriesWithMessages)
  } catch (error) {
    console.error("Error fetching inquiries:", error)
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 })
  }
}
