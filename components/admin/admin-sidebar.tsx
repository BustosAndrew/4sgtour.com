'use client'

import Link from 'next/link'
import { Flag, LogOut, MessageSquare, Trophy, Home, FileText } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AdminSidebarProps {
  userName: string
}

export function AdminSidebar({ userName }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="flex w-[230px] flex-col bg-[#274C77] text-white">
      {/* Header */}
      <div className="p-6 pb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#3d6091]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="8" r="4" fill="white"/>
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="text-lg font-semibold">4SG Tour</div>
            <div className="text-sm text-white/70">Customize Golf Journey</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors hover:bg-white/10"
        >
          <Home className="h-5 w-5" />
          Home
        </Link>

        <Link
          href="/admin"
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
            pathname === '/admin' ? 'bg-white/20' : 'hover:bg-white/10'
          }`}
        >
          <Flag className="h-5 w-5" />
          Courses
        </Link>

        <Link
          href="/admin/tournaments"
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
            pathname.startsWith('/admin/tournaments') ? 'bg-white/20' : 'hover:bg-white/10'
          }`}
        >
          <Trophy className="h-5 w-5" />
          Tournaments
        </Link>

        <Link
          href="/admin/inbox"
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
            pathname === '/admin/inbox' || pathname.startsWith('/admin/inbox') ? 'bg-white/20' : 'hover:bg-white/10'
          }`}
        >
          <FileText className="h-5 w-5" />
          Inquiries
        </Link>

        <Link
          href="/admin/inbox"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors hover:bg-white/10"
        >
          <MessageSquare className="h-5 w-5" />
          Inbox
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
