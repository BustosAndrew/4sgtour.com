"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Send } from "lucide-react"
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
}

export function InboxList({ inquiries }: { inquiries: Inquiry[] }) {
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

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
          senderEmail: "admin@4seasonsgolftour.com",
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
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      {/* Inquiry List */}
      <Card className="p-4">
        <h2 className="mb-4 text-xl font-semibold">Inquiries</h2>
        <div className="space-y-2">
          {inquiries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inquiries yet</p>
          ) : (
            inquiries.map((inquiry) => (
              <button
                key={inquiry.id}
                onClick={() => setSelectedInquiry(inquiry)}
                className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                  selectedInquiry?.id === inquiry.id ? "border-primary bg-accent" : ""
                }`}
              >
                <div className="mb-1 flex items-start justify-between">
                  <p className="font-medium">{inquiry.customer_name}</p>
                  <Badge className={getStatusColor(inquiry.status)}>{inquiry.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{inquiry.trip_title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
                </p>
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Message Thread */}
      <Card className="flex flex-col p-4">
        {selectedInquiry ? (
          <>
            <div className="mb-4 border-b pb-4">
              <h2 className="text-xl font-semibold">{selectedInquiry.customer_name}</h2>
              <p className="text-sm text-muted-foreground">{selectedInquiry.customer_email}</p>
              <p className="mt-2 text-sm">
                <span className="font-medium">Trip:</span> {selectedInquiry.trip_title}
              </p>
              {selectedInquiry.package_name && (
                <p className="text-sm">
                  <span className="font-medium">Package:</span> {selectedInquiry.package_name}
                </p>
              )}
              {selectedInquiry.start_date && selectedInquiry.end_date && (
                <p className="text-sm">
                  <span className="font-medium">Travel Dates:</span> {selectedInquiry.start_date} to{" "}
                  {selectedInquiry.end_date}
                </p>
              )}
            </div>

            {/* Messages */}
            <div className="mb-4 flex-1 space-y-3 overflow-y-auto">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading messages...</p>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex ${message.is_admin ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.is_admin ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <p className="mb-1 text-xs font-medium">{message.sender_name}</p>
                      <p className="text-sm">{message.message_text}</p>
                      <p className="mt-1 text-xs opacity-70">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Send Message */}
            <div className="flex gap-2">
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
                className="flex-1"
                rows={2}
              />
              <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Select an inquiry to view messages</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
