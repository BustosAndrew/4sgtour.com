"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { LogOut, Pencil, Trash2, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

type Trip = {
  id: string
  title: string
  location: string
  price_regular: number
  continent: string | null
  courses_photo_url: string | null
  booking_url: string | null
}

const CONTINENTS = ["Africa", "South America", "North America", "Asia", "Europe"] as const

export function AdminCourses({ userName, trips }: { userName: string; trips: Trip[] }) {
  const [selectedContinent, setSelectedContinent] = useState<string>("Unassigned")
  const [isPending, startTransition] = useTransition()
  const [syncStatus, setSyncStatus] = useState<string>("")
  const router = useRouter()

  const unassignedTrips = trips.filter((trip) => !trip.continent)
  const filteredTrips =
    selectedContinent === "Unassigned" ? unassignedTrips : trips.filter((trip) => trip.continent === selectedContinent)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const handleSync = async () => {
    startTransition(async () => {
      try {
        setSyncStatus("Syncing trips from WeTravel...")
        const response = await fetch("/api/wetravel/sync", { method: "POST" })
        const data = await response.json()

        if (data.error) {
          setSyncStatus(`Error: ${data.message || data.error}`)
          setTimeout(() => setSyncStatus(""), 5000)
        } else {
          setSyncStatus(`Success! Synced ${data.synced} new trips, updated ${data.updated} existing trips.`)
          router.refresh()
          setTimeout(() => setSyncStatus(""), 5000)
        }
      } catch (error) {
        setSyncStatus("Failed to sync. Please check your WeTravel API configuration.")
        setTimeout(() => setSyncStatus(""), 5000)
      }
    })
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-[230px] bg-[#6b705c] p-6 text-white">
        <div className="mb-12 flex items-center gap-3">
          <div className="text-white">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 4L8 12V24C8 34 15 42 24 44C33 42 40 34 40 24V12L24 4Z" fill="currentColor" opacity="0.3" />
              <circle cx="24" cy="20" r="4" fill="currentColor" />
              <path d="M24 26L18 32H30L24 26Z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <div className="text-base font-semibold">4 SEASONS</div>
            <div className="text-base font-semibold">GOLF TOUR</div>
            <div className="text-xs">Customize Golf Journey</div>
          </div>
        </div>

        <nav className="space-y-2">
          <div className="rounded-lg bg-white/20 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
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
            </div>
          </div>

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
        <header className="border-b border-gray-300 bg-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Hello, {userName}!</h1>
              <p className="text-sm text-gray-600">Welcome Back!</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{userName}</span>
              <span className="text-xs text-gray-500">Admin</span>
              <div className="h-10 w-10 rounded-full bg-gray-300" />
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Courses</h2>
            <p className="text-sm text-gray-600">Create, delete, and edit courses</p>
          </div>

          {syncStatus && (
            <div
              className={`mb-4 rounded-lg p-4 ${syncStatus.startsWith("Error") ? "bg-red-100 text-red-800" : syncStatus.startsWith("Success") ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
            >
              {syncStatus}
            </div>
          )}

          <div className="mb-6 flex items-center justify-between rounded-lg bg-white p-6 shadow-sm">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedContinent("Unassigned")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selectedContinent === "Unassigned"
                    ? "bg-[#ff5f57] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Unassigned {unassignedTrips.length > 0 && `(${unassignedTrips.length})`}
              </button>
              {CONTINENTS.map((continent) => (
                <button
                  key={continent}
                  onClick={() => setSelectedContinent(continent)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    selectedContinent === continent
                      ? "bg-[#6b705c] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {continent === "South America"
                    ? "S. America"
                    : continent === "North America"
                      ? "N. America"
                      : continent}
                </button>
              ))}
            </div>
            <Button onClick={handleSync} disabled={isPending} className="bg-[#adc178] text-white hover:bg-[#9ab368]">
              {isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>+ Add Course</>
              )}
            </Button>
          </div>

          {selectedContinent === "Unassigned" && unassignedTrips.length > 0 && (
            <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm text-amber-800">
                <strong>Action Required:</strong> These trips need to be assigned to a continent before they appear on
                the site. Click the edit button to assign each trip.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTrips.map((trip) => (
              <div key={trip.id} className="overflow-hidden rounded-lg bg-[#6b705c] text-white shadow-md">
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
                      <span className="text-sm text-gray-400">No image</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <p className="mb-1 text-xs uppercase tracking-wide text-[#adc178]">Location</p>
                  <h3 className="mb-2 font-semibold text-white">{trip.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">${Number(trip.price_regular).toFixed(2)}</span>
                    <div className="flex gap-2">
                      <Link href={`/admin/trips/${trip.id}`}>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-[#ff5f57] hover:bg-white/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredTrips.length === 0 && (
              <div className="col-span-full rounded-lg bg-white p-12 text-center">
                <p className="text-gray-500">
                  {selectedContinent === "Unassigned"
                    ? "No unassigned courses. All trips have been organized!"
                    : `No courses found for ${selectedContinent}.`}
                </p>
                {selectedContinent === "Unassigned" && (
                  <p className="mt-2 text-sm text-gray-400">Click "Add Course" to sync from WeTravel.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
