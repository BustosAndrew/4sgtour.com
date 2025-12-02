"use client"

import Link from "next/link"
import { Flag, LogOut, BarChart3, MessageSquare } from "lucide-react"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface AdminSidebarProps {
  userName: string
}

export function AdminSidebar({ userName }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <aside className="flex w-[230px] flex-col bg-[#6b705c] text-white">
      {/* Logo */}
      <div className="border-b border-white/10 p-6">
        <div className="flex items-center justify-center">
          <img src="/logo.png" alt="4 Seasons Golf Tour" className="h-16 w-auto object-contain" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        <Link
          href="/admin"
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
            pathname === "/admin" ? "bg-white/20" : "hover:bg-white/10"
          }`}
        >
          <Flag className="h-5 w-5" />
          Courses
        </Link>

        <Link
          href="/admin/inbox"
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
            pathname === "/admin/inbox" ? "bg-white/20" : "hover:bg-white/10"
          }`}
        >
          <MessageSquare className="h-5 w-5" />
          Inbox
        </Link>

        <Link
          href="/admin/analytics"
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
            pathname === "/admin/analytics" ? "bg-white/20" : "hover:bg-white/10"
          }`}
        >
          <BarChart3 className="h-5 w-5" />
          Analytics
        </Link>

        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors hover:bg-white/10"
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </button>
      </nav>
    </aside>
  )
}
