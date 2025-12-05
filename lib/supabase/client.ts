import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createClient() {
  // Use globalThis to ensure singleton persists across module reloads and code splits
  if (typeof window !== "undefined") {
    // @ts-ignore - adding custom property to window
    if (!window.__supabaseClient) {
      // @ts-ignore
      window.__supabaseClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
    }
    // @ts-ignore
    return window.__supabaseClient
  }

  // Fallback for SSR (shouldn't happen but just in case)
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
