"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut, Pencil, Trash2, FileText } from 'lucide-react'
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'
import Link from "next/link"
import Image from "next/image"
import { InquiriesList } from "@/components/admin/inquiries-list"
import { AccountSettingsDialog } from "@/components/admin/account-settings-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Trip = {
  id: string
  title: string
  location: string
  price_regular: number
  continent: string
  courses_photo_url: string | null
  booking_url: string | null
}

const CONTINENTS = ["Africa", "South America", "North America", "Asia", "Europe"] as const

export function AdminCourses({ 
  userName, 
  trips,
  userEmail,
  userPhone,
  userPhotoUrl
}: { 
  userName: string
  trips: Trip[]
  userEmail: string
  userPhone: string | null
  userPhotoUrl: string | null
}) {
  const [activeTab, setActiveTab] = useState<"courses" | "inquiries">("courses")
  const [selectedContinent, setSelectedContinent] = useState<string>("All")
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const router = useRouter()

  const filteredTrips =
    selectedContinent === "All" 
      ? trips 
      : trips.filter((trip) => trip.continent === selectedContinent)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
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
          <button
            onClick={() => setActiveTab("courses")}
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
            onClick={() => setActiveTab("inquiries")}
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
              <span className="text-xs text-gray-500">Admin</span>
              <button
                onClick={() => setShowAccountSettings(true)}
                className="transition-opacity hover:opacity-80"
              >
                <Avatar className="h-10 w-10">
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

        <div className="p-8">
          {activeTab === "courses" ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Courses</h2>
                <p className="text-sm text-gray-600">Create, delete, and edit courses</p>
              </div>

              <div className="mb-6 flex items-center justify-between rounded-lg bg-white p-6 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedContinent("All")}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      selectedContinent === "All"
                        ? "bg-[#6b705c] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All ({trips.length})
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
                <Link href="/admin/trips/new">
                  <Button className="bg-[#adc178] text-white hover:bg-[#9ab368]">
                    + Add Course
                  </Button>
                </Link>
              </div>

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
                      {selectedContinent === "All"
                        ? "No trips yet."
                        : `No courses found for ${selectedContinent}.`}
                    </p>
                    <p className="mt-2 text-sm text-gray-400">Click "Add Course" to create a new trip.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Inquiries</h2>
                <p className="text-sm text-gray-600">View and manage customer booking inquiries</p>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <InquiriesList />
              </div>
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
