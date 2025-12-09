"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Mail, DollarSign, MessageSquare } from "lucide-react"
import type { Inquiry } from "@/lib/types/database"

interface InquiriesListProps {
  onViewInInbox?: (inquiryId: string) => void
}

export function InquiriesList({ onViewInInbox }: InquiriesListProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInquiries()
  }, [])

  const fetchInquiries = async () => {
    try {
      const response = await fetch("/api/admin/inquiries")
      const data = await response.json()
      setInquiries(data.inquiries || [])
    } catch (error) {
      console.error("Error fetching inquiries:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
      case "contacted":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20"
      case "converted":
        return "bg-[#6096BA]/20 text-[#274C77] border-[#6096BA]/30"
      case "cancelled":
        return "bg-red-500/10 text-red-700 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20"
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading inquiries...</div>
  }

  return (
    <div className="space-y-4">
      {inquiries.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No inquiries yet. When customers submit booking inquiries, they'll
          appear here.
        </Card>
      ) : (
        inquiries.map((inquiry) => (
          <Card key={inquiry.id} className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-lg">
                    {inquiry.trip_title}
                  </h3>
                  <Badge className={getStatusColor(inquiry.status)}>
                    {inquiry.status}
                  </Badge>
                </div>

                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{inquiry.customer_name}</span>
                    <span className="text-muted-foreground">
                      ({inquiry.customer_email})
                    </span>
                  </div>

                  {inquiry.start_date && inquiry.end_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {new Date(inquiry.start_date).toLocaleDateString()} -{" "}
                        {new Date(inquiry.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {inquiry.package_name && (
                    <div className="text-muted-foreground">
                      Package:{" "}
                      <span className="font-medium text-foreground">
                        {inquiry.package_name}
                      </span>
                    </div>
                  )}

                  {inquiry.add_ons && inquiry.add_ons.length > 0 && (
                    <div className="text-muted-foreground">
                      Add-ons:{" "}
                      <span className="font-medium text-foreground">
                        {inquiry.add_ons.join(", ")}
                      </span>
                    </div>
                  )}

                  {inquiry.rounds > 0 && (
                    <div className="text-muted-foreground">
                      Rounds:{" "}
                      <span className="font-medium text-foreground">
                        {inquiry.rounds}
                      </span>
                    </div>
                  )}

                  {inquiry.additional_requests && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Additional Requests:
                      </div>
                      <div className="text-sm bg-muted/50 rounded p-2">
                        {inquiry.additional_requests}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-small text-muted-foreground">
                  Submitted {new Date(inquiry.created_at).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-between sm:ml-4 sm:flex-col sm:items-end sm:text-right sm:gap-3">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xl font-bold">
                    {Number(inquiry.total_price).toFixed(2)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewInInbox?.(inquiry.id)}
                  className="mt-2 sm:mt-0"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View in Inbox
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
