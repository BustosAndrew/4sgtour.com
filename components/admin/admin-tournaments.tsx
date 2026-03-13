"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Pencil,
  Trash2,
  Menu,
  Trophy,
  Flag,
  ChevronDown,
  ChevronRight,
  Plus,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

import { AccountSettingsDialog } from "@/components/admin/account-settings-dialog"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type TournamentEvent = {
  id: string
  title: string
  slug: string
  date: string
  image: string | null
  location: string
}

type Tournament = {
  id: string
  slug: string
  name: string
  display_name: string | null
  logo: string | null
  hero_image: string | null
  tournament_events?: TournamentEvent[]
}

export function AdminTournaments({
  userName,
  tournaments,
  userEmail,
  userPhone,
  userPhotoUrl,
}: {
  userName: string
  tournaments: Tournament[]
  userEmail: string
  userPhone: string | null
  userPhotoUrl: string | null
}) {
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [deletingEvents, setDeletingEvents] = useState<Set<string>>(new Set())
  const [localTournaments, setLocalTournaments] = useState<Tournament[]>(tournaments)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedTournaments, setExpandedTournaments] = useState<Set<string>>(new Set())
  const router = useRouter()

  const toggleTournamentExpanded = (tournamentId: string) => {
    setExpandedTournaments((prev) => {
      const next = new Set(prev)
      if (next.has(tournamentId)) {
        next.delete(tournamentId)
      } else {
        next.add(tournamentId)
      }
      return next
    })
  }

  const handleDeleteEvent = async (tournamentId: string, eventId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!eventId || eventId === "undefined") {
      alert("This event is missing a valid ID and cannot be deleted.")
      return
    }

    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return
    }

    setDeletingEvents((prev) => new Set(prev).add(eventId))

    try {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/events/${eventId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete event")
      }

      setLocalTournaments((prev) =>
        prev.map((t) => {
          if (t.id === tournamentId) {
            return {
              ...t,
              tournament_events: t.tournament_events?.filter((ev) => ev.id !== eventId),
            }
          }
          return t
        })
      )
      router.refresh()
    } catch (error) {
      console.error("Error deleting event:", error)
      alert(error instanceof Error ? error.message : "Failed to delete event")
    } finally {
      setDeletingEvents((prev) => {
        const next = new Set(prev)
        next.delete(eventId)
        return next
      })
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - using shared AdminSidebar component */}
      <AdminSidebar
        userName={userName}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 bg-[#f4f3ee]">
        <header className="border-b border-gray-300 bg-white px-4 py-4 sm:px-8 sm:py-6">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="mr-2 text-gray-900 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900 sm:text-2xl">
                Tournament Management
              </h1>
              <p className="text-xs text-gray-600 sm:text-sm">
                Create, edit, and manage tournaments
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden text-xs text-gray-500 sm:inline">Admin</span>
              <button
                onClick={() => setShowAccountSettings(true)}
                className="transition-opacity hover:opacity-80"
              >
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  {userPhotoUrl && (
                    <AvatarImage src={userPhotoUrl || "/placeholder.svg"} alt={userName} />
                  )}
                  <AvatarFallback className="bg-gray-300 text-gray-600">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-8">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">Tournaments</h2>
            <p className="text-xs text-gray-600 sm:text-sm">
              Manage tournament series and their events
            </p>
          </div>

          <div className="mb-4 flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:mb-6 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                {localTournaments.length} tournament{localTournaments.length !== 1 ? "s" : ""} (Masters, Ryder Cup, The Open, US Open)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {localTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="overflow-hidden rounded-lg bg-white shadow-md"
              >
                {/* Tournament Header */}
                <div
                  className="flex cursor-pointer items-center gap-4 bg-primary p-4 text-white"
                  onClick={() => toggleTournamentExpanded(tournament.id)}
                >
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white">
                    {tournament.logo ? (
                      <Image
                        src={tournament.logo}
                        alt={tournament.name}
                        fill
                        className="object-contain p-1"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Trophy className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{tournament.name}</h3>
                    <p className="text-sm text-white/70">
                      {tournament.tournament_events?.length || 0} event
                      {(tournament.tournament_events?.length || 0) !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/admin/tournaments/${tournament.id}`} onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-white hover:bg-white/10"
                        title="Edit images"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    {expandedTournaments.has(tournament.id) ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </div>
                </div>

                {/* Events List */}
                {expandedTournaments.has(tournament.id) && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700">Events</h4>
                      <Link href={`/admin/tournaments/${tournament.id}/events/new`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 text-xs"
                        >
                          <Plus className="h-3 w-3" />
                          Add Event
                        </Button>
                      </Link>
                    </div>

                    {tournament.tournament_events && tournament.tournament_events.length > 0 ? (
                      <div className="space-y-2">
                        {tournament.tournament_events.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm"
                          >
                            <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                              {event.image ? (
                                <Image
                                  src={event.image}
                                  alt={event.title}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <Flag className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium text-gray-900">
                                {event.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {event.location} • {event.date}
                              </p>
                            </div>

                            <div className="flex items-center gap-1">
                              <Link href={`/admin/tournaments/${tournament.id}/events/${event.id}`}>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-gray-600 hover:bg-gray-100"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-500 hover:bg-red-50"
                                onClick={(e) => handleDeleteEvent(tournament.id, event.id, e)}
                                disabled={deletingEvents.has(event.id)}
                              >
                                <Trash2
                                  className={`h-4 w-4 ${
                                    deletingEvents.has(event.id) ? "animate-pulse" : ""
                                  }`}
                                />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg bg-white p-6 text-center">
                        <p className="text-sm text-gray-500">No events yet.</p>
                        <p className="mt-1 text-xs text-gray-400">
                          Click "Add Event" to create an event for this tournament.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {localTournaments.length === 0 && (
              <div className="rounded-lg bg-white p-12 text-center">
                <Trophy className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-gray-500">No tournaments yet.</p>
                <p className="mt-2 text-sm text-gray-400">
                  Click "Add Tournament" to create your first tournament.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <AccountSettingsDialog
        open={showAccountSettings}
        onOpenChange={setShowAccountSettings}
        userEmail={userEmail}
        userName={userName}
        userPhone={userPhone}
        userPhotoUrl={userPhotoUrl}
      />
    </div>
  )
}
