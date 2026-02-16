'use client'

import type React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Ticket, Users, Mail, User, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface TournamentTicketFormProps {
  eventTitle: string
  eventDate: string
  eventLocation: string
  tierName: string | null
  tierPrice: string | null
  backHref: string
  heroImage: string
}

export function TournamentTicketForm({
  eventTitle,
  eventDate,
  eventLocation,
  tierName,
  tierPrice,
  backHref,
  heroImage,
}: TournamentTicketFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [participants, setParticipants] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formattedTitle = eventTitle
    .split(' ')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/tournament-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventTitle: formattedTitle,
          tierName,
          tierPrice,
          name,
          email,
          participants: Number(participants),
          notes,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send inquiry')
      }

      setIsSuccess(true)
      setName('')
      setEmail('')
      setParticipants('')
      setNotes('')
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[40vh] sm:h-[45vh] md:h-[50vh] w-full">
        <img
          src={heroImage || '/placeholder.svg?height=600&width=1200'}
          alt={formattedTitle}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <p
            className="text-xs uppercase tracking-[0.25em] text-white/90 sm:text-sm"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Get Tickets
          </p>
          <h1
            className="mt-3 text-center text-3xl italic text-white sm:text-4xl md:text-5xl text-balance"
            style={{ fontFamily: 'var(--font-display-alt)' }}
          >
            {formattedTitle}
          </h1>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-white/70">
            <span>{eventLocation}</span>
            <span className="hidden sm:inline" aria-hidden="true">
              {'|'}
            </span>
            <span>{eventDate}</span>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="bg-[#fffff8] py-10 sm:py-14 md:py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          {/* Back link */}
          <Link
            href={backHref}
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-[#735c38] transition-colors hover:text-[#735c38]/70"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to event
          </Link>

          {/* Event + Tier info card */}
          <div className="mb-8 border border-[#d9d9d9] bg-[#f5f5f5] p-5 sm:p-6">
            <p
              className="text-sm font-bold uppercase tracking-wider text-[#22333b]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Selected Event
            </p>
            <p
              className="mt-2 text-base font-semibold text-[#735c38] sm:text-lg"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {formattedTitle}
            </p>
            {tierName && (
              <p
                className="mt-1 text-sm text-[#22333b]/70"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Package: <span className="font-semibold text-[#22333b]">{tierName}</span>
              </p>
            )}
          </div>

          {/* Success state */}
          {isSuccess ? (
            <div className="border border-[#495c48]/30 bg-[#495c48]/5 p-8 text-center sm:p-10">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center bg-[#495c48]/10">
                <Ticket className="h-7 w-7 text-[#495c48]" />
              </div>
              <h2
                className="text-xl font-bold text-[#22333b] sm:text-2xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Inquiry Sent
              </h2>
              <p
                className="mt-3 text-sm text-[#22333b]/70 sm:text-base"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Thank you for your interest! Our team will review your inquiry and get back to you shortly.
              </p>
              <Link
                href={backHref}
                className="mt-6 inline-block bg-[#495c48] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3a4a3b]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Back to Event
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <h2
                className="text-xl font-bold text-[#22333b] sm:text-2xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Your Information
              </h2>

              {/* Name */}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="ticket-name"
                  className="flex items-center gap-2 text-sm font-semibold text-[#735c38] sm:text-base"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="ticket-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  className="h-11 border-[#d9d9d9] bg-white text-[#22333b] placeholder:text-[#22333b]/40 focus-visible:ring-[#735c38]"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="ticket-email"
                  className="flex items-center gap-2 text-sm font-semibold text-[#735c38] sm:text-base"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="ticket-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="h-11 border-[#d9d9d9] bg-white text-[#22333b] placeholder:text-[#22333b]/40 focus-visible:ring-[#735c38]"
                />
              </div>

              {/* Number of Participants */}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="ticket-participants"
                  className="flex items-center gap-2 text-sm font-semibold text-[#735c38] sm:text-base"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  <Users className="h-4 w-4" />
                  Number of Participants
                </Label>
                <Input
                  id="ticket-participants"
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="1"
                  className="h-11 border-[#d9d9d9] bg-white text-[#22333b] placeholder:text-[#22333b]/40 focus-visible:ring-[#735c38]"
                />
              </div>

              {/* Additional Notes */}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="ticket-notes"
                  className="flex items-center gap-2 text-sm font-semibold text-[#735c38] sm:text-base"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  <FileText className="h-4 w-4" />
                  Additional Notes
                  <span className="ml-1 font-normal text-[#22333b]/50">(Optional)</span>
                </Label>
                <Textarea
                  id="ticket-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requirements, dietary needs, accessibility requests, etc."
                  className="min-h-[120px] resize-none border-[#d9d9d9] bg-white text-[#22333b] placeholder:text-[#22333b]/40 focus-visible:ring-[#735c38]"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full bg-[#495c48] text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#3a4a3b] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {isLoading ? 'Sending...' : 'Submit Inquiry'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
