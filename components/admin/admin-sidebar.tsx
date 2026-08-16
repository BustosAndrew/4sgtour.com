'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { FileText, Home, KeyRound, LogOut, MessageSquare, Trophy, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export type AdminTab = 'courses' | 'tournaments' | 'inquiries' | 'inbox'

interface AdminSidebarProps {
  mobileMenuOpen?: boolean
  onMobileMenuClose?: () => void
  /**
   * The four main sections are tabs inside /admin, not routes. That page
   * passes `onSelectTab` and switches in place; every other admin page omits
   * it and the items become links back to /admin?tab=…, which it reads.
   */
  activeTab?: AdminTab
  onSelectTab?: (tab: AdminTab) => void
}

const TABS: Array<{ tab: AdminTab; label: string }> = [
  { tab: 'courses', label: 'Courses' },
  { tab: 'tournaments', label: 'Tournaments' },
  { tab: 'inquiries', label: 'Inquiries' },
  { tab: 'inbox', label: 'Inbox' },
]

const ITEM_CLASS =
  'flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors'

function itemClass(active: boolean) {
  return `${ITEM_CLASS} ${
    active ? 'bg-white/20 text-white' : 'text-white hover:bg-white/10'
  }`
}

/** The Courses mark — a plain house/flag glyph, not in lucide. */
function CoursesIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 flex-shrink-0"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}

function TabIcon({ tab }: { tab: AdminTab }) {
  if (tab === 'courses') return <CoursesIcon />
  if (tab === 'tournaments') return <Trophy className="h-5 w-5 flex-shrink-0" />
  if (tab === 'inquiries') return <FileText className="h-5 w-5 flex-shrink-0" />
  return <MessageSquare className="h-5 w-5 flex-shrink-0" />
}

export function AdminSidebar({
  mobileMenuOpen = false,
  onMobileMenuClose,
  activeTab,
  onSelectTab,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const close = () => onMobileMenuClose?.()

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-[230px] transform bg-[#274C77] p-6 text-white transition-transform duration-300 lg:relative lg:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Close button for mobile */}
      <button
        onClick={close}
        className="absolute right-4 top-4 text-white lg:hidden"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="mb-12 flex items-center gap-3">
        <div className="text-white">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M24 4L8 12V24C8 34 15 42 24 44C33 42 40 34 40 24V12L24 4Z"
              fill="currentColor"
              opacity="0.3"
            />
            <circle cx="24" cy="20" r="4" fill="currentColor" />
            <path d="M24 26L18 32H30L24 26Z" fill="currentColor" />
          </svg>
        </div>
        <div>
          <div className="text-base font-semibold">4SG Tour</div>
          <div className="text-xs">Customize Golf Journey</div>
        </div>
      </div>

      <nav className="space-y-2">
        <Link href="/" onClick={close} className={itemClass(false)}>
          <Home className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">Home</span>
        </Link>

        {TABS.map(({ tab, label }) =>
          onSelectTab ? (
            <button
              key={tab}
              onClick={() => {
                onSelectTab(tab)
                close()
              }}
              className={itemClass(activeTab === tab)}
            >
              <TabIcon tab={tab} />
              <span className="font-medium">{label}</span>
            </button>
          ) : (
            <Link
              key={tab}
              href={`/admin?tab=${tab}`}
              onClick={close}
              className={itemClass(activeTab === tab)}
            >
              <TabIcon tab={tab} />
              <span className="font-medium">{label}</span>
            </Link>
          ),
        )}

        <Link
          href="/admin/api-access"
          onClick={close}
          className={itemClass(pathname.startsWith('/admin/api-access'))}
        >
          <KeyRound className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">API Access</span>
        </Link>

        <button onClick={handleSignOut} className={itemClass(false)}>
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">Log Out</span>
        </button>
      </nav>
    </aside>
  )
}
