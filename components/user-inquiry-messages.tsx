"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Send, ChevronDown, ChevronUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Message {
  id: string
  inquiry_id: string
  sender_name: string
  sender_email: string
  is_admin: boolean
  message_text: string
  created_at: string
}

interface UserInquiryMessagesProps {
  inquiryId: string
  userName: string
  userEmail: string
  tripTitle: string
}

export function UserInquiryMessages({
  inquiryId,
  userName,
  userEmail,
  tripTitle,
}: UserInquiryMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const loadMessages = async () => {
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
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryId,
          messageText: newMessage,
          isAdmin: false,
          senderName: userName,
          senderEmail: userEmail,
          // Provide context for admin email notifications
          tripTitle,
          customerName: userName,
          customerEmail: userEmail,
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
    if (isExpanded) {
      loadMessages()
    }
  }, [isExpanded, inquiryId])

  return (
    <div className="mt-4 border-t pt-4">
      <Button
        variant="outline"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between"
        size="sm"
      >
        <span className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Messages {messages.length > 0 && `(${messages.length})`}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Messages */}
          <div className="max-h-[400px] space-y-3 overflow-y-auto border bg-muted/30 p-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading messages...
              </p>
            ) : messages.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No messages yet. Send a message to the admin!
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.is_admin ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 ${
                      message.is_admin
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <p className="mb-1 text-xs font-medium">
                      {message.sender_name}
                    </p>
                    <p className="text-sm">{message.message_text}</p>
                    <p className="mt-1 text-xs opacity-70">
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Send Message */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message to the admin..."
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
            <Button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
