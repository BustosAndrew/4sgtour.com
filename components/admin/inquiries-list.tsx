"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Mail, DollarSign, MessageSquare, Trash2, CheckCircle } from "lucide-react"
import { differenceInDays } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Inquiry } from "@/lib/types/database"

interface InquiryWithPayment extends Inquiry {
  payment_status?: string | null
  amount_paid?: number | null
  is_fully_paid?: boolean
}

interface InquiriesListProps {
  onViewInInbox?: (inquiryId: string) => void
}

type FilterType = "all" | "paid" | "unpaid"

export function InquiriesList({ onViewInInbox }: InquiriesListProps) {
  const [inquiries, setInquiries] = useState<InquiryWithPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [inquiryToDelete, setInquiryToDelete] = useState<InquiryWithPayment | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [filter, setFilter] = useState<FilterType>("all")

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

  const handleDeleteClick = (inquiry: InquiryWithPayment) => {
    setInquiryToDelete(inquiry)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!inquiryToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/inquiries/${inquiryToDelete.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setInquiries((prev) => prev.filter((i) => i.id !== inquiryToDelete.id))
        setDeleteDialogOpen(false)
        setInquiryToDelete(null)
      } else {
        console.error("Failed to delete inquiry")
      }
    } catch (error) {
      console.error("Error deleting inquiry:", error)
    } finally {
      setDeleting(false)
    }
  }

  const filteredInquiries = inquiries.filter((inquiry) => {
    if (filter === "all") return true
    if (filter === "paid") return (inquiry as any).inquiry_type === "stripe_booking"
    if (filter === "unpaid") return (inquiry as any).inquiry_type !== "stripe_booking"
    return true
  })

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
    <>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <div className="flex rounded-lg border border-input bg-background p-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("paid")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === "paid"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Paid
          </button>
          <button
            onClick={() => setFilter("unpaid")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === "unpaid"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Unpaid
          </button>
        </div>
        <span className="text-sm text-muted-foreground ml-2">
          ({filteredInquiries.length} {filteredInquiries.length === 1 ? "inquiry" : "inquiries"})
        </span>
      </div>

      <div className="space-y-4">
        {filteredInquiries.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            {filter === "all"
              ? "No inquiries yet. When customers submit booking inquiries, they'll appear here."
              : filter === "paid"
                ? "No paid bookings found."
                : "No unpaid inquiries found."}
          </Card>
        ) : (
          filteredInquiries.map((inquiry) => (
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
                    {(inquiry as any).inquiry_type === "tournament" && (
                      <Badge variant="outline" className="text-xs">
                        Tournament
                      </Badge>
                    )}
                    {inquiry.payment_status && (
                      <Badge 
                        className={
                          inquiry.is_fully_paid 
                            ? "bg-green-500/10 text-green-700 border-green-500/20" 
                            : "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                        }
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {inquiry.is_fully_paid ? "Fully Paid" : "Paid"}
                      </Badge>
                    )}
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

                    {inquiry.start_date && inquiry.end_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Duration:</span>
                        <span className="font-medium text-foreground">
                          {differenceInDays(
                            new Date(inquiry.end_date),
                            new Date(inquiry.start_date),
                          ) + 1}{" "}
                          days
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

                    {(inquiry as any).participants && (
                      <div className="text-muted-foreground">
                        Participants:{" "}
                        <span className="font-medium text-foreground">
                          {(inquiry as any).participants}
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
                  <div className="flex flex-col items-end gap-1">
                    {inquiry.amount_paid && inquiry.amount_paid > 0 && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          ${Number(inquiry.amount_paid).toFixed(2)} paid
                        </span>
                      </div>
                    )}
                    {inquiry.total_price && Number(inquiry.total_price) > 0 && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xl font-bold">
                          {Number(inquiry.total_price).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewInInbox?.(inquiry.id)}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      View in Inbox
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(inquiry)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Inquiry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the inquiry from{" "}
              <span className="font-medium">{inquiryToDelete?.customer_name}</span>{" "}
              for <span className="font-medium">{inquiryToDelete?.trip_title}</span>?
              This action cannot be undone and will also delete any associated messages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
