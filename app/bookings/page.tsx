import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { differenceInDays, format } from "date-fns"
import { CheckCircle2, Calendar, MapPin, Users, Clock } from "lucide-react"
import Link from "next/link"
import { UserInquiryMessages } from "@/components/user-inquiry-messages"

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, display_name")
    .eq("id", user.id)
    .single()

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("*")
    .eq("customer_email", profile?.email || user.email)
    .order("created_at", { ascending: false })

  return (
    <div className="bg-background">
      <SiteHeaderWrapper />
      <main className="container px-4 pt-28 pb-8 sm:px-6 lg:px-8 lg:pt-32 min-h-screen">
        {params.success === "true" && (
          <div className="mb-8 border border-primary/20 bg-primary/10 p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-primary" />
              <div>
                <h2 className="font-semibold text-foreground">
                  Inquiry Submitted!
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your booking inquiry has been successfully submitted.
                  We&apos;ll contact you shortly to confirm the details.
                </p>
              </div>
            </div>
          </div>
        )}

        <h1 className="mb-8 text-2xl font-semibold sm:text-3xl">
          My Inquiries
        </h1>

        {inquiries && inquiries.length > 0 ? (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="border border-border bg-card p-4 sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg">
                      {inquiry.trip_title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {inquiry.package_name && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {inquiry.package_name}
                        </span>
                      )}
                    </p>
                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      {inquiry.start_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Start:
                          </span>{" "}
                          <span className="font-medium">
                            {format(
                              new Date(inquiry.start_date),
                              "MMM d, yyyy",
                            )}
                          </span>
                        </div>
                      )}
                      {inquiry.end_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            End:
                          </span>{" "}
                          <span className="font-medium">
                            {format(new Date(inquiry.end_date), "MMM d, yyyy")}
                          </span>
                        </div>
                      )}
                      {inquiry.start_date && inquiry.end_date && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Duration:
                          </span>{" "}
                          <span className="font-medium">
                            {differenceInDays(
                              new Date(inquiry.end_date),
                              new Date(inquiry.start_date),
                            ) + 1}{" "}
                            days
                          </span>
                        </div>
                      )}
                      {inquiry.rounds > 0 && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Rounds:
                          </span>{" "}
                          <span className="font-medium">{inquiry.rounds}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Submitted:
                        </span>{" "}
                        <span className="font-medium">
                          {format(new Date(inquiry.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    {inquiry.additional_requests && (
                      <div className="mt-3 text-sm">
                        <span className="text-muted-foreground">Notes:</span>{" "}
                        <span className="text-foreground">
                          {inquiry.additional_requests}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between sm:ml-4 sm:flex-col sm:items-end sm:text-right">
                    <div className="mb-0 sm:mb-2">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-medium ${
                          inquiry.status === "converted"
                            ? "bg-primary/10 text-primary"
                            : inquiry.status === "contacted"
                            ? "bg-blue-100 text-blue-700"
                            : inquiry.status === "cancelled"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {inquiry.status === "converted"
                          ? "Confirmed"
                          : inquiry.status === "contacted"
                          ? "In Progress"
                          : inquiry.status === "cancelled"
                          ? "Cancelled"
                          : "Pending"}
                      </span>
                    </div>
                    {inquiry.total_price > 0 && (
                      <p className="text-lg font-bold sm:text-xl">
                        ${inquiry.total_price.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <UserInquiryMessages
                  inquiryId={inquiry.id}
                  userName={profile?.display_name || profile?.email || "Guest"}
                  userEmail={profile?.email || user.email || ""}
                  tripTitle={inquiry.trip_title}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-border bg-card p-8 text-center sm:p-12">
            <p className="text-muted-foreground">
              You haven&apos;t submitted any booking inquiries yet.
            </p>
            <Button asChild className="mt-4">
              <Link href="/destinations">Browse Destinations</Link>
            </Button>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
