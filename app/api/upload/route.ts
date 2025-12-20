import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
// import { getUserType } from "@/lib/supabase/get-user-type" // Removed as no longer needed

export const runtime = "nodejs"

function sanitizeFilename(name: string) {
  // Keep it simple: remove path separators and collapse whitespace.
  return name
    .replace(/\\/g, "-")
    .replace(/\//g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 120)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // No userType check needed - authenticated users can upload

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Use a unique pathname to avoid collisions (e.g. multiple uploads named image.jpg).
    const safeName = sanitizeFilename(file.name || "upload")
    const uniquePath = `uploads/${crypto.randomUUID()}-${safeName}`

    const blob = await put(uniquePath, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type || undefined,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Error uploading to Blob:", error)
    const message = error instanceof Error ? error.message : "Upload failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
