import { getPackages } from "@/lib/wetravel/packages"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ tripUuid: string }> }) {
  try {
    const { tripUuid } = await params
    const packages = await getPackages(tripUuid)
    return NextResponse.json(packages)
  } catch (error) {
    console.error("[v0] Error fetching packages:", error)
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 })
  }
}
