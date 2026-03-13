"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  Pencil,
  Trash2,
  FileText,
  Home,
  Menu,
  X,
  MessageSquare,
  Trophy,
  Languages,
  ChevronDown,
  ChevronRight,
  Plus,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { InquiriesList } from "@/components/admin/inquiries-list"
import { InboxList } from "@/components/admin/inbox-list"
import { AccountSettingsDialog } from "@/components/admin/account-settings-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Trip = {
  id: string
  slug: string
  title: string
  location: string
  price_regular: number
  continent: string
  courses_photo_url: string | null
  booking_url: string | null
  packages?: Array<{
    id: string
    name: string
    price: number
  }>
}

type TournamentEvent = {
  id: string
  title: string
  slug: string
  date: string
  image: string | null
  location: string | null
}

type Tournament = {
  id: string
  name: string
  slug: string
  tournament_events: TournamentEvent[]
}

const CONTINENTS = [
  "World",
  "Latin America",
  "North America",
  "Asia",
  "Europe",
] as const

export function AdminCourses({
  userName,
  trips,
  tournaments,
  userEmail,
  userPhone,
  userPhotoUrl,
  initialInquiryId,
  initialTab,
}: {
  userName: string
  trips: Trip[]
  tournaments: Tournament[]
  userEmail: string
  userPhone: string | null
  userPhotoUrl: string | null
  initialInquiryId?: string
  initialTab?: "courses" | "tournaments" | "inquiries" | "inbox"
}) {
  const [activeTab, setActiveTab] = useState<"courses" | "tournaments" | "inquiries" | "inbox">(
    initialTab || "courses",
  )
  const [selectedContinent, setSelectedContinent] = useState<string>("All")
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [deletingTrips, setDeletingTrips] = useState<Set<string>>(new Set())
  const [deletingEvents, setDeletingEvents] = useState<Set<string>>(new Set())
  const [localTrips, setLocalTrips] = useState<Trip[]>(trips)
  const [localTournaments, setLocalTournaments] = useState<Tournament[]>(tournaments)
  const [expandedTournaments, setExpandedTournaments] = useState<Set<string>>(new Set())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [inquiries, setInquiries] = useState<any[]>([])
  const [loadingInquiries, setLoadingInquiries] = useState(false)
  const [focusedInquiryId, setFocusedInquiryId] = useState<string | undefined>(
    initialInquiryId,
  )
  const [isTranslating, setIsTranslating] = useState(false)
  const [translateResult, setTranslateResult] = useState<string | null>(null)
  const [translateProgress, setTranslateProgress] = useState<{ completed: number; total: number; message: string } | null>(null)
  const [isTranslatingTournaments, setIsTranslatingTournaments] = useState(false)
  const [translateTournamentsResult, setTranslateTournamentsResult] = useState<string | null>(null)
  const [translateTournamentsProgress, setTranslateTournamentsProgress] = useState<{ completed: number; total: number; message: string } | null>(null)
  const router = useRouter()

  const handleTranslateAll = async () => {
    if (isTranslating) return
    setIsTranslating(true)
    setTranslateResult(null)
    setTranslateProgress(null)
    try {
      const response = await fetch("/api/admin/translate-trips", {
        method: "POST",
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Translation failed")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === "progress") {
                setTranslateProgress({
                  completed: data.completed,
                  total: data.total,
                  message: data.message
                })
              } else if (data.type === "complete") {
                setTranslateResult(data.message)
                setTranslateProgress(null)
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      setTranslateResult(`Error: ${error instanceof Error ? error.message : "Failed to connect to translation service"}`)
    } finally {
      setIsTranslating(false)
      setTranslateProgress(null)
    }
  }

  const handleTranslateTournaments = async () => {
    if (isTranslatingTournaments) return
    setIsTranslatingTournaments(true)
    setTranslateTournamentsResult(null)
    setTranslateTournamentsProgress(null)
    try {
      const response = await fetch("/api/admin/translate-tournaments", {
        method: "POST",
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Translation failed")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === "progress") {
                setTranslateTournamentsProgress({
                  completed: data.completed,
                  total: data.total,
                  message: data.message
                })
              } else if (data.type === "complete") {
                setTranslateTournamentsResult(data.message)
                setTranslateTournamentsProgress(null)
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      setTranslateTournamentsResult(`Error: ${error instanceof Error ? error.message : "Failed to connect to translation service"}`)
    } finally {
      setIsTranslatingTournaments(false)
      setTranslateTournamentsProgress(null)
    }
  }

  const toggleTournamentExpand = (tournamentId: string) => {
    setExpandedTournaments(prev => {
      const next = new Set(prev)
      if (next.has(tournamentId)) {
        next.delete(tournamentId)
      } else {
        next.add(tournamentId)
      }
      return next
    })
  }

  const handleDeleteEvent = async (eventId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return
    }

    setDeletingEvents(prev => new Set(prev).add(eventId))

    try {
      const response = await fetch(`/api/admin/tournaments/events/${eventId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete event")
      }

      // Remove from local state
      setLocalTournaments(prev => 
        prev.map(t => ({
          ...t,
          tournament_events: t.tournament_events.filter(e => e.id !== eventId)
        }))
      )
      router.refresh()
    } catch (error) {
      console.error("Error deleting event:", error)
      alert(error instanceof Error ? error.message : "Failed to delete event")
    } finally {
      setDeletingEvents(prev => {
        const next = new Set(prev)
        next.delete(eventId)
        return next
      })
    }
  }

  const getTripDisplayPrice = (trip: Trip) => {
    const packages = trip.packages || []
    const premium = packages.find((p) => p.name === "Premium")
    if (premium?.price != null) return Number(premium.price)

    const lowest = packages.reduce<number | null>((acc, p) => {
      const value = Number(p.price)
      if (Number.isNaN(value)) return acc
      if (acc == null) return value
      return Math.min(acc, value)
    }, null)
    if (lowest != null) return lowest

    const legacy = Number(trip.price_regular)
    return Number.isFinite(legacy) ? legacy : 0
  }

  const filteredTrips =
    selectedContinent === "All"
      ? localTrips
      : localTrips.filter((trip) => trip.continent === selectedContinent)

  // Switch to inbox tab when initialInquiryId is present (on mount and when it changes)
  useEffect(() => {
    if (initialInquiryId) {
      setFocusedInquiryId(initialInquiryId)
      setActiveTab("inbox")
    }
  }, [initialInquiryId])

  // Fetch inquiries when inbox tab is active or when an inquiry is focused
  useEffect(() => {
    if ((activeTab === "inbox" || focusedInquiryId) && inquiries.length === 0) {
      setLoadingInquiries(true)
      fetch("/api/admin/inquiries")
        .then((res) => res.json())
        .then((data) => {
          setInquiries(data.inquiries || [])
        })
        .catch((error) => console.error("Error fetching inquiries:", error))
        .finally(() => setLoadingInquiries(false))
    }
  }, [activeTab, focusedInquiryId])

  const handleViewInInbox = (inquiryId: string) => {
    setFocusedInquiryId(inquiryId)
    setActiveTab("inbox")
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const handleDeleteTrip = async (trip: Trip, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const tripId = trip.id
    if (!tripId || tripId === "undefined") {
      console.error("Attempted to delete trip with invalid id:", tripId)
      alert(
        "This course is missing a valid ID and cannot be deleted. Please refresh the page and try again, or contact support.",
      )
      return
    }

    if (
      !confirm(
        "Are you sure you want to delete this course? This action cannot be undone.",
      )
    ) {
      return
    }

    setDeletingTrips((prev) => new Set(prev).add(tripId))

    try {
      const response = await fetch(`/api/admin/trips/${tripId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete course")
      }

      // Remove from local state
      setLocalTrips((prev) => prev.filter((t) => t.id !== tripId))
      router.refresh()
    } catch (error) {
      console.error("Error deleting trip:", error)
      alert(error instanceof Error ? error.message : "Failed to delete course")
    } finally {
      setDeletingTrips((prev) => {
        const next = new Set(prev)
        next.delete(tripId)
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

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[230px] transform bg-[#274C77] p-6 text-white transition-transform duration-300 lg:relative lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button for mobile */}
        <button
          onClick={() => setMobileMenuOpen(false)}
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
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-white transition-colors hover:bg-white/10">
              <Home className="h-5 w-5" />
              <span className="font-medium">Home</span>
            </button>
          </Link>

          <button
            onClick={() => {
              setActiveTab("courses")
              setMobileMenuOpen(false)
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
              activeTab === "courses"
                ? "bg-white/20 text-white"
                : "text-white hover:bg-white/10"
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            <span className="font-medium">Courses</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("tournaments")
              setMobileMenuOpen(false)
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
              activeTab === "tournaments"
                ? "bg-white/20 text-white"
                : "text-white hover:bg-white/10"
            }`}
          >
            <Trophy className="h-5 w-5" />
            <span className="font-medium">Tournaments</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("inquiries")
              setMobileMenuOpen(false)
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
              activeTab === "inquiries"
                ? "bg-white/20 text-white"
                : "text-white hover:bg-white/10"
            }`}
          >
            <FileText className="h-5 w-5" />
            <span className="font-medium">Inquiries</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("inbox")
              setMobileMenuOpen(false)
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
              activeTab === "inbox"
                ? "bg-white/20 text-white"
                : "text-white hover:bg-white/10"
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="font-medium">Inbox</span>
          </button>

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-white transition-colors hover:bg-white/10"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Log Out</span>
          </button>
        </nav>
      </aside>

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
                Hello, {userName}!
              </h1>
              <p className="text-xs text-gray-600 sm:text-sm">Welcome Back!</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden text-xs text-gray-500 sm:inline">
                Admin
              </span>
              <button
                onClick={() => setShowAccountSettings(true)}
                className="transition-opacity hover:opacity-80"
              >
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  {userPhotoUrl && (
                    <AvatarImage
                      src={userPhotoUrl || "/placeholder.svg"}
                      alt={userName}
                    />
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
          {activeTab === "courses" ? (
            <>
              <div className="mb-4 sm:mb-6">
                <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                  Courses
                </h2>
                <p className="text-xs text-gray-600 sm:text-sm">
                  Create, delete, and edit courses
                </p>
              </div>

              <div className="mb-4 flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:mb-6 sm:p-6">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedContinent("All")}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                      selectedContinent === "All"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All ({localTrips.length})
                  </button>
                  {CONTINENTS.map((continent) => (
                    <button
                      key={continent}
                      onClick={() => setSelectedContinent(continent)}
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                        selectedContinent === continent
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {continent === "Latin America"
                        ? "L. America"
                        : continent === "North America"
                        ? "N. America"
                        : continent}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:self-end">
                  <Button
                    onClick={handleTranslateAll}
                    disabled={isTranslating}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Languages className="mr-2 h-4 w-4" />
                    {isTranslating ? "Translating..." : "Translate All"}
                  </Button>
                  <Link
                    href="/admin/trips/new"
                    className="w-full sm:w-auto"
                  >
                    <Button className="w-full bg-[#274C77] text-white hover:bg-[#274C77]/90 sm:w-auto">
                      + Add Course
                    </Button>
                  </Link>
                </div>
                {translateProgress && (
                  <div className="w-full space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{translateProgress.message}</span>
                      <span>{translateProgress.completed}/{translateProgress.total}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div 
                        className="h-full bg-[#274C77] transition-all duration-300"
                        style={{ width: `${(translateProgress.completed / translateProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {translateResult && !translateProgress && (
                  <p className={`text-sm ${translateResult.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
                    {translateResult}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {filteredTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="overflow-hidden rounded-lg bg-primary text-white shadow-md"
                  >
                    <div className="relative h-40 bg-white">
                      {trip.courses_photo_url ? (
                        <Image
                          src={trip.courses_photo_url || "/placeholder.svg"}
                          alt={trip.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gray-100">
                          <span className="text-sm text-gray-400">
                            No image
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <p className="mb-1 text-xs uppercase tracking-wide text-primary-foreground/70">
                        Location
                      </p>
                      <h3 className="mb-2 font-semibold text-white">
                        {trip.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">
                          ${getTripDisplayPrice(trip).toFixed(2)}
                        </span>
                        <div className="flex gap-2">
                          <Link href={`/admin/trips/${trip.id}`}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-white hover:bg-white/10"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-[#ff5f57] hover:bg-white/10"
                            onClick={(e) => handleDeleteTrip(trip, e)}
                            disabled={deletingTrips.has(trip.id)}
                          >
                            <Trash2
                              className={`h-4 w-4 ${
                                deletingTrips.has(trip.id)
                                  ? "animate-pulse"
                                  : ""
                              }`}
                            />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredTrips.length === 0 && (
                  <div className="col-span-full rounded-lg bg-white p-12 text-center">
                    <p className="text-gray-500">
                      {selectedContinent === "All"
                        ? "No trips yet."
                        : `No courses found for ${selectedContinent}.`}
                    </p>
                    <p className="mt-2 text-sm text-gray-400">
                      Click "Add Course" to create a new trip.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : activeTab === "tournaments" ? (
            <>
              <div className="mb-4 sm:mb-6">
                <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                  Tournaments
                </h2>
                <p className="text-xs text-gray-600 sm:text-sm">
                  Manage tournament events (Masters, Ryder Cup, The Open, US Open)
                </p>
              </div>

              <div className="mb-4 flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:mb-6 sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-600">
                    {localTournaments.length} tournament{localTournaments.length !== 1 ? "s" : ""} with{" "}
                    {localTournaments.reduce((acc, t) => acc + t.tournament_events.length, 0)} total events
                  </p>
                  <Button
                    onClick={handleTranslateTournaments}
                    disabled={isTranslatingTournaments}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Languages className="mr-2 h-4 w-4" />
                    {isTranslatingTournaments ? "Translating..." : "Translate All Events"}
                  </Button>
                </div>
                {translateTournamentsProgress && (
                  <div className="w-full space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{translateTournamentsProgress.message}</span>
                      <span>{translateTournamentsProgress.completed}/{translateTournamentsProgress.total}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div 
                        className="h-full bg-[#274C77] transition-all duration-300"
                        style={{ width: `${(translateTournamentsProgress.completed / translateTournamentsProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {translateTournamentsResult && !translateTournamentsProgress && (
                  <p className={`text-sm ${translateTournamentsResult.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
                    {translateTournamentsResult}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {localTournaments.map((tournament) => (
                  <div key={tournament.id} className="rounded-lg bg-white shadow-sm">
                    <button
                      onClick={() => toggleTournamentExpand(tournament.id)}
                      className="flex w-full items-center justify-between p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Trophy className="h-5 w-5 text-[#274C77]" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{tournament.name}</h3>
                          <p className="text-sm text-gray-500">
                            {tournament.tournament_events.length} event{tournament.tournament_events.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      {expandedTournaments.has(tournament.id) ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {expandedTournaments.has(tournament.id) && (
                      <div className="border-t border-gray-100 p-4">
                        <div className="mb-4 flex justify-end">
                          <Link href={`/admin/tournaments/${tournament.id}/events/new`}>
                            <Button size="sm" className="bg-[#274C77] text-white hover:bg-[#274C77]/90">
                              <Plus className="mr-2 h-4 w-4" />
                              Add Event
                            </Button>
                          </Link>
                        </div>

                        {tournament.tournament_events.length === 0 ? (
                          <p className="text-center text-sm text-gray-500 py-4">
                            No events yet. Click "Add Event" to create one.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {tournament.tournament_events.map((event) => (
                              <div
                                key={event.id}
                                className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                              >
                                <div className="flex items-center gap-3">
                                  {event.image && (
                                    <Image
                                      src={event.image}
                                      alt={event.title}
                                      width={48}
                                      height={48}
                                      className="rounded object-cover"
                                    />
                                  )}
                                  <div>
                                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                                    <p className="text-sm text-gray-500">
                                      {event.date ? new Date(event.date).toLocaleDateString() : "No date"} 
                                      {event.location && ` • ${event.location}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Link href={`/admin/tournaments/${tournament.id}/events/${event.id}`}>
                                    <Button size="icon" variant="ghost" className="h-8 w-8">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-red-500 hover:text-red-600"
                                    onClick={(e) => handleDeleteEvent(event.id, e)}
                                    disabled={deletingEvents.has(event.id)}
                                  >
                                    <Trash2 className={`h-4 w-4 ${deletingEvents.has(event.id) ? "animate-pulse" : ""}`} />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : activeTab === "inquiries" ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Inquiries
                </h2>
                <p className="text-sm text-gray-600">
                  View and manage customer booking inquiries
                </p>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <InquiriesList onViewInInbox={handleViewInInbox} />
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Inbox</h2>
                <p className="text-sm text-gray-600">
                  Message customers about their inquiries
                </p>
              </div>

              {loadingInquiries ? (
                <div className="rounded-lg bg-white p-12 text-center shadow-sm">
                  <p className="text-gray-500">Loading inquiries...</p>
                </div>
              ) : (
                <InboxList
                  inquiries={inquiries}
                  initialInquiryId={focusedInquiryId}
                />
              )}
            </>
          )}
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
