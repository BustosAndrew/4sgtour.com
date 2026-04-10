import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedHr } from "@/components/ui/animated-hr"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { Calendar, DollarSign, Clock, User, Mail, Phone } from "lucide-react"
import type { Metadata } from "next"

// Prevent indexing of private package pages
export const metadata: Metadata = {
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

interface PackagePageProps {
  params: Promise<{ id: string }>
}

export default async function PrivatePackagePage({ params }: PackagePageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the custom package inquiry
  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .select("*")
    .eq("id", id)
    .eq("is_custom_package", true)
    .single()

  if (error || !inquiry) {
    notFound()
  }

  const isPaid = inquiry.status === "paid" || inquiry.status === "completed"
  const depositPercentage = inquiry.deposit_percentage || 100
  const totalPrice = inquiry.total_price || 0
  const depositAmount = (totalPrice * depositPercentage) / 100
  const remainderAmount = totalPrice - depositAmount

  return (
    <div className="min-h-screen bg-background">
      <SiteHeaderWrapper />

      {/* Hero Section - matching trip detail page style */}
      <section className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-[#274C77] to-[#6096BA]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 top-0 pt-24 sm:pt-28 md:pt-32 lg:pt-36">
          <div className="container px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-medium uppercase tracking-wider text-white/80">
              Custom Package
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl">
              {inquiry.trip_title}
            </h1>
            {inquiry.customer_name && (
              <p className="mt-1 text-sm text-white/90 drop-shadow-lg sm:text-base md:text-lg">
                Prepared for {inquiry.customer_name}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="container px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-4">
          {/* Right Column - Payment Card (shows first on mobile via order) */}
          <div className="order-1 lg:order-2 space-y-8">
            {/* Payment Summary - Desktop Only */}
            <div className="hidden lg:block">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                Payment
              </h2>
              <div className="mt-2 mb-4">
                <AnimatedHr />
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm md:text-base">
                Review your package details and complete payment below.
              </p>

              <div className="mt-6 space-y-4">
                {/* Package Price */}
                <div
                  className="group flex flex-col gap-4 border-l-[3px] py-4 pl-5 pr-2 transition-colors"
                  style={{ borderColor: "#274C77" }}
                >
                  <div className="flex-1">
                    <h3 className="font-serif text-lg font-bold text-foreground sm:text-xl">
                      {depositPercentage === 100 ? "Full Payment" : `${depositPercentage}% Deposit`}
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                      ${depositAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    {depositPercentage < 100 && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Total: ${totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>

                  {isPaid ? (
                    <div className="rounded-lg bg-emerald-50 p-4 text-center">
                      <DollarSign className="mx-auto h-8 w-8 text-emerald-600" />
                      <p className="mt-2 font-semibold text-emerald-700">Payment Complete</p>
                      <p className="mt-1 text-sm text-emerald-600">Thank you for your payment!</p>
                    </div>
                  ) : inquiry.payment_link ? (
                    <a href={inquiry.payment_link} className="shrink-0">
                      <AnimatedButton
                        startColor="#274C77"
                        endColor="#1a3a5c"
                        hoverText="Let's Go!"
                        className="w-full sm:w-auto sm:px-8"
                      >
                        Pay Now
                      </AnimatedButton>
                    </a>
                  ) : (
                    <div className="rounded-lg bg-amber-50 p-4 text-center">
                      <p className="font-semibold text-amber-700">Payment Link Pending</p>
                      <p className="mt-1 text-sm text-amber-600">
                        A payment link will be sent to you shortly.
                      </p>
                    </div>
                  )}
                </div>

                {/* Remainder Info */}
                {depositPercentage < 100 && (
                  <div
                    className="group flex flex-col gap-2 border-l-[3px] py-4 pl-5 pr-2 transition-colors"
                    style={{ borderColor: "#6096BA" }}
                  >
                    <div className="flex-1">
                      <h3 className="font-serif text-lg font-bold text-foreground sm:text-xl">
                        Remainder Due
                      </h3>
                      <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                        ${remainderAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                      {inquiry.remainder_due_date && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Due by {format(new Date(inquiry.remainder_due_date), "MMMM d, yyyy")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Left Column - Text Content */}
          <div className="order-2 space-y-8 lg:order-1">
            {/* Package Details / Overview */}
            <div>
              <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                Overview
              </h2>
              <div className="mt-2 mb-4">
                <AnimatedHr />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg whitespace-pre-wrap">
                {inquiry.custom_package_description || "Your custom golf package has been prepared. Please review the details and complete your payment to confirm your booking."}
              </p>
            </div>

            {/* Travel Dates */}
            {(inquiry.start_date || inquiry.end_date) && (
              <div>
                <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                  Travel Dates
                </h2>
                <div className="mt-2 mb-4">
                  <AnimatedHr />
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-foreground sm:text-base">
                    <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-[#274C77]" />
                    <span>
                      {inquiry.start_date && format(new Date(inquiry.start_date), "MMMM d, yyyy")}
                      {inquiry.start_date && inquiry.end_date && " - "}
                      {inquiry.end_date && format(new Date(inquiry.end_date), "MMMM d, yyyy")}
                    </span>
                  </li>
                </ul>
              </div>
            )}

            {/* Contact Information */}
            <div>
              <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                Contact Information
              </h2>
              <div className="mt-2 mb-4">
                <AnimatedHr />
              </div>
              <ul className="space-y-3">
                {inquiry.customer_name && (
                  <li className="flex items-start gap-3 text-sm text-foreground sm:text-base">
                    <User className="mt-0.5 h-5 w-5 shrink-0 text-[#274C77]" />
                    <span>{inquiry.customer_name}</span>
                  </li>
                )}
                {inquiry.customer_email && (
                  <li className="flex items-start gap-3 text-sm text-foreground sm:text-base">
                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#274C77]" />
                    <span>{inquiry.customer_email}</span>
                  </li>
                )}
                {inquiry.customer_phone && (
                  <li className="flex items-start gap-3 text-sm text-foreground sm:text-base">
                    <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#274C77]" />
                    <span>{inquiry.customer_phone}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Payment Section - Mobile Only */}
            <div className="lg:hidden">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                Payment
              </h2>
              <div className="mt-2 mb-4">
                <AnimatedHr />
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm md:text-base">
                Review your package details and complete payment below.
              </p>

              <div className="mt-6 space-y-4">
                {/* Package Price */}
                <div
                  className="group flex flex-col gap-4 border-l-[3px] py-4 pl-5 pr-2 transition-colors sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderColor: "#274C77" }}
                >
                  <div className="flex-1">
                    <h3 className="font-serif text-lg font-bold text-foreground sm:text-xl">
                      {depositPercentage === 100 ? "Full Payment" : `${depositPercentage}% Deposit`}
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                      ${depositAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    {depositPercentage < 100 && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Total: ${totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>

                  {isPaid ? (
                    <div className="rounded-lg bg-emerald-50 p-4 text-center">
                      <DollarSign className="mx-auto h-8 w-8 text-emerald-600" />
                      <p className="mt-2 font-semibold text-emerald-700">Payment Complete</p>
                      <p className="mt-1 text-sm text-emerald-600">Thank you for your payment!</p>
                    </div>
                  ) : inquiry.payment_link ? (
                    <a href={inquiry.payment_link} className="shrink-0">
                      <AnimatedButton
                        startColor="#274C77"
                        endColor="#1a3a5c"
                        hoverText="Let's Go!"
                        className="w-full sm:w-auto sm:px-8"
                      >
                        Pay Now
                      </AnimatedButton>
                    </a>
                  ) : (
                    <div className="rounded-lg bg-amber-50 p-4 text-center">
                      <p className="font-semibold text-amber-700">Payment Link Pending</p>
                      <p className="mt-1 text-sm text-amber-600">
                        A payment link will be sent to you shortly.
                      </p>
                    </div>
                  )}
                </div>

                {/* Remainder Info */}
                {depositPercentage < 100 && (
                  <div
                    className="group flex flex-col gap-2 border-l-[3px] py-4 pl-5 pr-2 transition-colors"
                    style={{ borderColor: "#6096BA" }}
                  >
                    <div className="flex-1">
                      <h3 className="font-serif text-lg font-bold text-foreground sm:text-xl">
                        Remainder Due
                      </h3>
                      <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                        ${remainderAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                      {inquiry.remainder_due_date && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Due by {format(new Date(inquiry.remainder_due_date), "MMMM d, yyyy")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
