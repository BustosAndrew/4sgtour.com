import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { redirect } from 'next/navigation'
import { CreateTripForm } from "@/components/admin/create-trip-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function NewTripPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const userType = await getUserType()

  if (userType !== "admin") {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold sm:text-2xl">Create New Trip</h1>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/admin">Back to Admin</Link>
          </Button>
        </div>
        <CreateTripForm />
      </main>
    </div>
  )
}
