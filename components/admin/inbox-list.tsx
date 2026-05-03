"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { UpdateInquiryStatus } from "@/components/admin/update-inquiry-status"
import { MessageSquare, Send, Pencil, Trash2, Check, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Inquiry {
  id: string
  trip_title: string
  customer_name: string
  customer_email: string
  status: string
  created_at: string
  package_name?: string
  start_date?: string
  end_date?: string
}

interface Message {
  id: string
  inquiry_id: string
  sender_name: string
  sender_email: string
  is_admin: boolean
  message_text: string
  created_at: string
  updated_at?: string
}

export function InboxList({
  inquiries,
  initialInquiryId,
}: {
  inquiries: Inquiry[]
  initialInquiryId?: string
}) {
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [localInquiries, setLocalInquiries] = useState<Inquiry[]>(inquiries)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const editRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setLocalInquiries(inquiries)
    // Auto-select inquiry if initialInquiryId is provided
    if (initialInquiryId && inquiries.length > 0) {
      const inquiry = inquiries.find((inq) => inq.id === initialInquiryId)
      if (inquiry) {
        setSelectedInquiry(inquiry)
      }
    }
  }, [inquiries, initialInquiryId])

  const handleStatusChange = (inquiryId: string, newStatus: string) => {
    // Update local state
    setLocalInquiries((prev) =>
      prev.map((inq) =>
        inq.id === inquiryId ? { ...inq, status: newStatus } : inq,
      ),
    )
    // Update selected inquiry if it's the one being changed
    if (selectedInquiry?.id === inquiryId) {
      setSelectedInquiry({ ...selectedInquiry, status: newStatus })
    }
  }

  const loadMessages = async (inquiryId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/messages?inquiryId=${inquiryId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error("Error loading messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!selectedInquiry || !newMessage.trim()) return

    setSending(true)
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryId: selectedInquiry.id,
          messageText: newMessage,
          isAdmin: true,
          senderName: "Admin",
          senderEmail: "info@4sgtour.com",
          // Provide inquiry context so the API can send email even if RLS blocks reading the inquiry row
          tripTitle: selectedInquiry.trip_title,
          customerName: selectedInquiry.customer_name,
          customerEmail: selectedInquiry.customer_email,
        }),
      })

      if (response.ok) {
        const message = await response.json()
        setMessages([...messages, message])
        setNewMessage("")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const startEdit = (message: Message) => {
    setEditingId(message.id)
    setEditText(message.message_text)
    setTimeout(() => editRef.current?.focus(), 50)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText("")
  }

  const saveEdit = async (messageId: string) => {
    if (!editText.trim()) return
    setSavingEdit(true)
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageText: editText }),
      })
      if (response.ok) {
        const updated = await response.json()
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? updated : m)),
        )
        setEditingId(null)
        setEditText("")
      }
    } catch (error) {
      console.error("Error editing message:", error)
    } finally {
      setSavingEdit(false)
    }
  }

  const deleteMessage = async (messageId: string) => {
    setDeletingId(messageId)
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId))
      }
    } catch (error) {
      console.error("Error deleting message:", error)
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    if (selectedInquiry) {
      loadMessages(selectedInquiry.id)
    }
  }, [selectedInquiry])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-[#6096BA]/20 text-[#274C77]"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-[300px_1fr] xl:grid-cols-[400px_1fr]" style={{ height: "calc(100vh - 180px)" }}>
      {/* Inquiry List */}
      <Card className="flex flex-col overflow-hidden p-3 sm:p-4">
        <h2 className="mb-3 flex-none text-lg font-semibold sm:mb-4 sm:text-xl">
          Inquiries
        </h2>
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {localInquiries.length === 0 ? (
            <p className="text-xs text-muted-foreground sm:text-sm">
              No inquiries yet
            </p>
          ) : (
            localInquiries.map((inquiry) => (
              <button
                key={inquiry.id}
                onClick={() => setSelectedInquiry(inquiry)}
                className={`w-full rounded-lg border p-2 text-left transition-all sm:p-3 ${
                  selectedInquiry?.id === inquiry.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium sm:text-base ${
                    selectedInquiry?.id === inquiry.id
                      ? "text-primary-foreground"
                      : "text-foreground"
                  }`}>
                    {inquiry.customer_name}
                  </p>
                  <Badge
                    className={`text-xs ${
                      selectedInquiry?.id === inquiry.id
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : getStatusColor(inquiry.status)
                    }`}
                  >
                    {inquiry.status}
                  </Badge>
                </div>
                <p className={`text-xs sm:text-sm ${
                  selectedInquiry?.id === inquiry.id
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground"
                }`}>
                  {inquiry.trip_title}
                </p>
                <p className={`mt-1 text-xs ${
                  selectedInquiry?.id === inquiry.id
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                }`}>
                  {formatDistanceToNow(new Date(inquiry.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Message Thread */}
      <Card className="flex min-h-0 flex-col overflow-hidden p-3 sm:p-4">
        {selectedInquiry ? (
          <>
            <div className="mb-3 flex-none border-b pb-3 sm:mb-4 sm:pb-4">
              <h2 className="text-lg font-semibold sm:text-xl">
                {selectedInquiry.customer_name}
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {selectedInquiry.customer_email}
              </p>
              <p className="mt-2 text-xs sm:text-sm">
                <span className="font-medium">Trip:</span>{" "}
                {selectedInquiry.trip_title}
              </p>
              {selectedInquiry.package_name && (
                <p className="text-xs sm:text-sm">
                  <span className="font-medium">Package:</span>{" "}
                  {selectedInquiry.package_name}
                </p>
              )}
              {selectedInquiry.start_date && selectedInquiry.end_date && (
                <p className="text-xs sm:text-sm">
                  <span className="font-medium">Travel Dates:</span>{" "}
                  {selectedInquiry.start_date} to {selectedInquiry.end_date}
                </p>
              )}
              <div className="mt-3">
                <UpdateInquiryStatus
                  inquiryId={selectedInquiry.id}
                  currentStatus={selectedInquiry.status}
                  onStatusChange={(newStatus) =>
                    handleStatusChange(selectedInquiry.id, newStatus)
                  }
                />
              </div>
            </div>

            {/* Messages */}
            <div className="mb-3 min-h-0 flex-1 space-y-2 overflow-y-auto sm:mb-4 sm:space-y-3">
              {loading ? (
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Loading messages...
                </p>
              ) : messages.length === 0 ? (
                <div className="py-8 text-center">
                  <MessageSquare className="mx-auto mb-2 h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.is_admin
                  const isEditing = editingId === message.id
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div className="group relative max-w-[85%] sm:max-w-[80%]">
                        {/* Edit/delete controls — hover to reveal */}
                        {!isEditing && (
                          <div className={`absolute -top-6 hidden items-center gap-1 group-hover:flex ${isOwn ? "right-0" : "left-0"}`}>
                            <button
                              onClick={() => startEdit(message)}
                              className="rounded bg-background p-1 shadow-sm border text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit message"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => deleteMessage(message.id)}
                              disabled={deletingId === message.id}
                              className="rounded bg-background p-1 shadow-sm border text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                              title="Delete message"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <div
                          className={`rounded-lg p-2 sm:p-3 ${
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="mb-1 text-xs font-medium">
                            {message.sender_name}
                          </p>
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                ref={editRef}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    saveEdit(message.id)
                                  }
                                  if (e.key === "Escape") cancelEdit()
                                }}
                                rows={2}
                                className="w-full resize-none rounded border-0 bg-primary-foreground/20 p-1.5 text-xs text-inherit placeholder:opacity-60 focus:outline-none focus:ring-1 focus:ring-primary-foreground/40 sm:text-sm"
                              />
                              <div className="flex gap-1 justify-end">
                                <button
                                  onClick={cancelEdit}
                                  className="rounded p-1 opacity-70 hover:opacity-100 transition-opacity"
                                  title="Cancel"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => saveEdit(message.id)}
                                  disabled={savingEdit || !editText.trim()}
                                  className="rounded p-1 opacity-70 hover:opacity-100 transition-opacity disabled:opacity-30"
                                  title="Save"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs sm:text-sm">{message.message_text}</p>
                          )}
                          <p className="mt-1 text-xs opacity-70">
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                            })}
                            {message.updated_at && message.updated_at !== message.created_at && (
                              <span className="ml-1">(edited)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Send Message */}
            <div className="flex flex-none gap-2 border-t pt-3 sm:pt-4">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                className="flex-1 text-sm"
                rows={2}
              />
              <Button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                size="icon"
                className="h-auto"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-2 h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
              <p className="text-sm text-muted-foreground">
                Select an inquiry to view messages
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
