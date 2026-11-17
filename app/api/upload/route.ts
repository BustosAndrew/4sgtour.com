import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"

export const runtime = "nodejs"

// Admin-only, images only (decided 2026-11-16). Every caller is an admin
// screen; open to any signed-in user, anyone could create an account and
// host arbitrary files (HTML, SVG with scripts, …) on our public Blob store.
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
])
// Vercel Functions reject request bodies over 4.5 MB anyway; say so clearly.
const MAX_BYTES = 4.5 * 1024 * 1024

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

    if ((await getUserType()) !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP, AVIF or GIF images can be uploaded" },
        { status: 415 },
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image is too large (max 4.5 MB)" },
        { status: 413 },
      )
    }

    // Use a unique pathname to avoid collisions (e.g. multiple uploads named image.jpg).
    const safeName = sanitizeFilename(file.name || "upload")
    const uniquePath = `uploads/${crypto.randomUUID()}-${safeName}`

    const blob = await put(uniquePath, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Error uploading to Blob:", error)
    const message = error instanceof Error ? error.message : "Upload failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
