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
      setMessage("")

      // Reset success message after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000)
    }, 1000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {isSuccess && (
        <div className="rounded-lg bg-primary/10 p-4 text-sm text-primary">
          Thank you for your message! We&apos;ll get back to you soon.
        </div>
      )}

      <div className="space-y-3">
        <Label htmlFor="name" className="text-base font-medium text-white">
          Your Name
        </Label>
        <Input
          id="name"
          type="text"
          placeholder=""
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12 bg-white/20 text-white placeholder:text-white/50 text-base border-white/30"
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="email" className="text-base font-medium text-white">
          Your Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder=""
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 bg-white/20 text-white placeholder:text-white/50 text-base border-white/30"
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="message" className="text-base font-medium text-white">
          Your Message
        </Label>
        <Textarea
          id="message"
          placeholder=""
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[200px] resize-none bg-white/20 text-white placeholder:text-white/50 text-base border-white/30"
        />
      </div>

      {error && (
        <div className="bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="h-12 w-full bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90"
        disabled={isLoading}
      >
        {isLoading ? "Sending..." : "Send Message"}
      </Button>
    </form>
  )
}
