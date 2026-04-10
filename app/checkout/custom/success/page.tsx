import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Metadata } from "next"

// Prevent indexing of this private page
export const metadata: Metadata = {
  title: "Payment Successful | 4 Seasons Golf Tour",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function CustomCheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeaderWrapper />
      <main className="container flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mx-auto max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-emerald-100 p-4">
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>
          </div>
          
          <h1 className="mb-4 text-3xl font-bold text-foreground">
            Payment Successful
          </h1>
          
          <p className="mb-8 text-lg text-muted-foreground">
            Thank you for your payment. We have received your booking and will be in touch shortly with more details about your trip.
          </p>
          
          <div className="space-y-3">
            <Button asChild className="w-full bg-[#274C77] hover:bg-[#274C77]/90">
              <Link href="/bookings">View My Bookings</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
          
          <p className="mt-8 text-sm text-muted-foreground">
            Questions? Contact us at{" "}
            <a href="mailto:info@4sgtour.com" className="text-[#274C77] underline">
              info@4sgtour.com
            </a>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
