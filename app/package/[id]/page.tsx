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

      {/* Hero Section */}
      <section className="relative h-[40vh] sm:h-[50vh] w-full bg-gradient-to-br from-[#274C77] to-[#6096BA]">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-x-0 top-0 pt-24 sm:pt-28 md:pt-32 lg:pt-36">
          <div className="container px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-medium uppercase tracking-wider text-white/80">
              Custom Package
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl">
              {inquiry.trip_title}
            </h1>
            {inquiry.customer_name && (
              <p className="mt-2 text-base text-white/90 drop-shadow-lg sm:text-lg">
                Prepared for {inquiry.customer_name}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="container px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Left Column - Package Details */}
            <div className="space-y-8 lg:col-span-3">
              {/* Description */}
              {inquiry.custom_package_description && (
                <div>
                  <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                    Package Details
                  </h2>
                  <div className="mt-2 mb-4">
                    <AnimatedHr />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base whitespace-pre-wrap">
                    {inquiry.custom_package_description}
                  </p>
                </div>
              )}

              {/* Travel Dates */}
              {(inquiry.start_date || inquiry.end_date) && (
                <div>
                  <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                    Travel Dates
                  </h2>
                  <div className="mt-2 mb-4">
                    <AnimatedHr />
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="h-5 w-5 text-[#274C77]" />
                    <span className="text-sm sm:text-base">
                      {inquiry.start_date && format(new Date(inquiry.start_date), "MMMM d, yyyy")}
                      {inquiry.start_date && inquiry.end_date && " - "}
                      {inquiry.end_date && format(new Date(inquiry.end_date), "MMMM d, yyyy")}
                    </span>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                  Contact Information
                </h2>
                <div className="mt-2 mb-4">
                  <AnimatedHr />
                </div>
                <div className="space-y-3">
                  {inquiry.customer_name && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <User className="h-5 w-5 text-[#274C77]" />
                      <span className="text-sm sm:text-base">{inquiry.customer_name}</span>
                    </div>
                  )}
                  {inquiry.customer_email && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="h-5 w-5 text-[#274C77]" />
                      <span className="text-sm sm:text-base">{inquiry.customer_email}</span>
                    </div>
                  )}
                  {inquiry.customer_phone && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Phone className="h-5 w-5 text-[#274C77]" />
                      <span className="text-sm sm:text-base">{inquiry.customer_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Payment Card */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 rounded-xl border border-border bg-card p-6 shadow-lg">
                <h3 className="text-lg font-bold text-foreground">Payment Summary</h3>
                <div className="mt-4 space-y-4">
                  {/* Total Price */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Package Price</span>
                    <span className="text-lg font-bold text-foreground">
                      ${totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Deposit Details */}
                  {depositPercentage < 100 && (
                    <>
                      <div className="border-t border-border pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            {depositPercentage}% Deposit
                          </span>
                          <span className="font-semibold text-foreground">
                            ${depositAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-muted-foreground">Remainder Due</span>
                          <span className="font-semibold text-foreground">
                            ${remainderAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {inquiry.remainder_due_date && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              Due by {format(new Date(inquiry.remainder_due_date), "MMMM d, yyyy")}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Payment Status / Action */}
                  <div className="border-t border-border pt-4">
                    {isPaid ? (
                      <div className="rounded-lg bg-emerald-50 p-4 text-center">
                        <DollarSign className="mx-auto h-8 w-8 text-emerald-600" />
                        <p className="mt-2 font-semibold text-emerald-700">
                          Payment Complete
                        </p>
                        <p className="mt-1 text-sm text-emerald-600">
                          Thank you for your payment!
                        </p>
                      </div>
                    ) : inquiry.payment_link ? (
                      <a href={inquiry.payment_link} className="block">
                        <AnimatedButton
                          startColor="#274C77"
                          endColor="#1a3a5c"
                          hoverText="Let's Go!"
                          className="w-full"
                        >
                          {depositPercentage === 100
                            ? `Pay $${totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                            : `Pay ${depositPercentage}% Deposit ($${depositAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })})`}
                        </AnimatedButton>
                      </a>
                    ) : (
                      <div className="rounded-lg bg-amber-50 p-4 text-center">
                        <p className="font-semibold text-amber-700">
                          Payment Link Pending
                        </p>
                        <p className="mt-1 text-sm text-amber-600">
                          A payment link will be sent to you shortly.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
