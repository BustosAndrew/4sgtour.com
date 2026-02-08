"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

export function ContactForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Simulate form submission
    setTimeout(() => {
      setIsLoading(false)
      setIsSuccess(true)
      setName("")
      setEmail("")
      setSubject("")
      setMessage("")

      // Reset success message after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000)
    }, 1000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isSuccess && (
        <div className="rounded-md bg-[#495c48]/10 p-4 text-sm text-[#495c48]">
          Thank you for your message! We&apos;ll get back to you soon.
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-[#735c38]">
          Your Name
        </Label>
        <Input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 rounded-md border-[#d9d9d9] bg-[#ffffff] text-[#22333b] focus-visible:ring-[#735c38]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-[#735c38]">
          Your Email
        </Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 rounded-md border-[#d9d9d9] bg-[#ffffff] text-[#22333b] focus-visible:ring-[#735c38]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject" className="text-sm font-medium text-[#735c38]">
          Subject
        </Label>
        <Input
          id="subject"
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="h-11 rounded-md border-[#d9d9d9] bg-[#ffffff] text-[#22333b] focus-visible:ring-[#735c38]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-sm font-medium text-[#735c38]">
          Your Message
        </Label>
        <Textarea
          id="message"
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[140px] resize-none rounded-md border-[#d9d9d9] bg-[#ffffff] text-[#22333b] focus-visible:ring-[#735c38]"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="h-11 w-full rounded-md bg-[#735c38] text-[#ffffff] font-semibold hover:bg-[#735c38]/90"
        disabled={isLoading}
      >
        {isLoading ? "Sending..." : "Send Message"}
      </Button>
    </form>
  )
}
