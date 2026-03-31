"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Send, ChevronDown, ChevronUp, Pencil, Trash2, Check, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const editRef = useRef<HTMLTextAreaElement>(null)

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
              messages.map((message) => {
                const isOwn = !message.is_admin
                const isEditing = editingId === message.id
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`group relative max-w-[80%]`}>
                      {/* Edit/delete controls for own messages */}
                      {isOwn && !isEditing && (
                        <div className="absolute -top-6 right-0 hidden items-center gap-1 group-hover:flex">
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
                        className={`p-3 ${
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
                              className="w-full resize-none rounded border-0 bg-primary-foreground/20 p-1.5 text-sm text-inherit placeholder:opacity-60 focus:outline-none focus:ring-1 focus:ring-primary-foreground/40"
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
                          <p className="text-sm">{message.message_text}</p>
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
