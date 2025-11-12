import { getOptions } from "@/lib/wetravel/packages"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ tripUuid: string }> }) {
  try {
    const { tripUuid } = await params
    const options = await getOptions(tripUuid)
    return NextResponse.json(options)
  } catch (error) {
    console.error("[v0] Error fetching options:", error)
    return NextResponse.json({ error: "Failed to fetch options" }, { status: 500 })
  }
}
