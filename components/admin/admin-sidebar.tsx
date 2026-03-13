'use client'

import Link from 'next/link'
import { Flag, LogOut, MessageSquare, Trophy, Home, FileText, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AdminSidebarProps {
  userName: string
  mobileMenuOpen?: boolean
  onMobileMenuClose?: () => void
}

export function AdminSidebar({ userName, mobileMenuOpen, onMobileMenuClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const handleLinkClick = () => {
    onMobileMenuClose?.()
  }

  // If mobileMenuOpen prop is provided, use mobile-friendly positioning
  const isMobileControlled = typeof mobileMenuOpen === 'boolean'

  return (
    <aside
      className={
        isMobileControlled
          ? `fixed inset-y-0 left-0 z-50 w-[230px] transform bg-[#274C77] p-6 text-white transition-transform duration-300 lg:relative lg:translate-x-0 ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'flex w-[230px] flex-col bg-[#274C77] p-6 text-white'
      }
    >
      {/* Close button for mobile */}
      {isMobileControlled && (
        <button
          onClick={onMobileMenuClose}
          className="absolute right-4 top-4 text-white lg:hidden"
        >
          <X className="h-6 w-6" />
        </button>
      )}

      {/* Header */}
      <div className="pb-8">
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
      <nav className="flex-1 space-y-1">
        <Link
          href="/"
          onClick={handleLinkClick}
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors hover:bg-white/10"
        >
          <Home className="h-5 w-5" />
          Home
        </Link>

        <Link
          href="/admin"
          onClick={handleLinkClick}
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
            pathname === '/admin' ? 'bg-white/20' : 'hover:bg-white/10'
          }`}
        >
          <Flag className="h-5 w-5" />
          Courses
        </Link>

        <Link
          href="/admin?tab=tournaments"
          onClick={handleLinkClick}
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
            pathname.startsWith('/admin/tournaments') || pathname === '/admin' ? 'bg-white/20' : 'hover:bg-white/10'
          }`}
        >
          <Trophy className="h-5 w-5" />
          Tournaments
        </Link>

        <Link
          href="/admin/inbox"
          onClick={handleLinkClick}
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
            pathname === '/admin/inbox' || pathname.startsWith('/admin/inbox') ? 'bg-white/20' : 'hover:bg-white/10'
          }`}
        >
          <FileText className="h-5 w-5" />
          Inquiries
        </Link>

        <Link
          href="/admin/inbox"
          onClick={handleLinkClick}
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
