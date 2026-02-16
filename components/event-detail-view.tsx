'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, Clock, Check, X, ChevronRight } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { TournamentEvent } from '@/lib/tournament-data'

interface EventDetailViewProps {
  event: TournamentEvent
  tournamentSlug: string
  tournamentHeroImage: string
}

function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [current, setCurrent] = useState(0)

  if (images.length === 0) return null

  return (
    <div className="relative">
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <img
          src={images[current] || '/placeholder.svg'}
          alt={`${alt} ${current + 1}`}
          className="h-full w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2.5">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrent(idx)}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                idx === current ? 'bg-foreground' : 'bg-border'
              }`}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function EventDetailView({ event, tournamentSlug, tournamentHeroImage }: EventDetailViewProps) {
  const [allExpanded, setAllExpanded] = useState(false)
  const [openItems, setOpenItems] = useState<string[]>(['day-0'])

  const handleExpandAll = () => {
    if (allExpanded) {
      setOpenItems([])
      setAllExpanded(false)
    } else {
      setOpenItems(event.itineraryDays.map((_, i) => `day-${i}`))
      setAllExpanded(true)
    }
  }

  const sectionIds = {
    highlights: 'trip-highlights',
    itinerary: 'travel-itinerary',
    inclusions: 'package-inclusions',
    pricing: 'pricing',
  }

  return (
    <div>
      {/* Hero Banner - always use the tournament-level hero image */}
      <section className="relative h-[40vh] sm:h-[45vh] md:h-[50vh] w-full">
        <img
          src={tournamentHeroImage || '/placeholder.svg'}
          alt={event.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <p
            className="text-xs uppercase tracking-[0.25em] text-white/90 sm:text-sm"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {event.date}
          </p>
          <h1
            className="mt-3 text-center text-3xl italic text-white sm:text-4xl md:text-5xl lg:text-6xl text-balance"
            style={{ fontFamily: 'var(--font-display-alt)' }}
          >
            {event.title.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
          </h1>
        </div>
      </section>

      {/* Mobile Sidebar - On This Page (visible below lg) */}
      <div className="bg-[#f2f0eb] px-4 py-6 sm:px-6 lg:hidden">
        <p
          className="text-sm font-bold uppercase tracking-wider text-[#2c2c2c]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          On This Page
        </p>
        <hr className="mt-3 border-[#d5d0c7]" />
        <nav className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
          {[
            { label: 'Trip Highlights', id: sectionIds.highlights },
            { label: 'Travel Itinerary', id: sectionIds.itinerary },
            { label: 'Package Inclusions', id: sectionIds.inclusions },
            { label: 'Pricing', id: sectionIds.pricing },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="flex items-center gap-2 text-sm text-[#2c2c2c] transition-colors hover:text-[#495c48]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#8a8272]" />
              <span className="underline underline-offset-2 decoration-[#8a8272]">{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="mt-5">
          <Link
            href="/contact"
            className="inline-block bg-[#495c48] px-8 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#3a4a3b]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Contact Us
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <section className="bg-[#fffff8] py-10 sm:py-14 md:py-16">
        <div className="flex">
          {/* Desktop Sidebar - flush left (hidden below lg) */}
          <aside className="hidden lg:block lg:w-60 lg:shrink-0">
            <div className="sticky top-28 bg-[#f2f0eb] px-6 py-8 ml-6 xl:ml-12">
              <p
                className="text-sm font-bold uppercase tracking-wider text-[#2c2c2c]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                On This Page
              </p>
              <hr className="mt-3 border-[#d5d0c7]" />
              <nav className="mt-5 flex flex-col gap-5">
                {[
                  { label: 'Trip Highlights', id: sectionIds.highlights },
                  { label: 'Travel Itinerary', id: sectionIds.itinerary },
                  { label: 'Package Inclusions', id: sectionIds.inclusions },
                  { label: 'Pricing', id: sectionIds.pricing },
                ].map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="flex items-center gap-3 text-sm text-[#2c2c2c] transition-colors hover:text-[#495c48]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#8a8272]" />
                    <span className="underline underline-offset-2 decoration-[#8a8272]">{item.label}</span>
                  </a>
                ))}
              </nav>
              <div className="mt-8">
                <Link
                  href="/contact"
                  className="inline-block w-full bg-[#495c48] px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#3a4a3b]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content Column */}
          <div className="flex-1 min-w-0 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
              {/* Title & Meta */}
              <h2
                className="text-2xl sm:text-3xl md:text-4xl text-[#735c38]"
                style={{ fontFamily: 'var(--font-display-alt)' }}
              >
                {event.title.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
              </h2>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#735c38]">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#735c38]" />
                  {event.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#735c38]" />
                  {event.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[#735c38]" />
                  {event.duration}
                </span>
              </div>

              {/* Description */}
              <div className="mt-6 flex flex-col gap-4">
                {event.description.map((p, i) => (
                  <p
                    key={i}
                    className="text-sm leading-relaxed text-[#735c38] sm:text-base"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {p}
                  </p>
                ))}
              </div>

              {/* Trip Highlights */}
              <div id={sectionIds.highlights} className="mt-10 scroll-mt-28">
                <h3
                  className="text-base font-bold uppercase tracking-wide text-[#735c38] sm:text-lg"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Trip Highlights:
                </h3>
                <ul className="mt-4 flex flex-col gap-2">
                  {event.tripHighlights.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-[#735c38] sm:text-base"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#735c38]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gallery 1 - Placeholder images */}
              <div className="mt-10">
                <ImageCarousel images={['/placeholder.svg?height=600&width=1200', '/placeholder.svg?height=600&width=1200', '/placeholder.svg?height=600&width=1200']} alt={event.title} />
              </div>

              {/* Travel Itinerary */}
              <div id={sectionIds.itinerary} className="mt-12 scroll-mt-28">
                <h3
                  className="text-base font-bold uppercase tracking-wide text-[#735c38] sm:text-lg"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Travel Itinerary & Features:
                </h3>
                <ul className="mt-4 flex flex-col gap-2">
                  {event.travelItinerary.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-[#735c38] sm:text-base"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#735c38]" />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Expand All */}
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={handleExpandAll}
                    className="text-sm font-medium text-[#735c38] underline underline-offset-2 transition-colors hover:text-[#735c38]/80"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {allExpanded ? 'Collapse all days' : 'Expand all days'}
                  </button>
                </div>

                {/* Day-by-Day Accordion */}
                <Accordion
                  type="multiple"
                  value={openItems}
                  onValueChange={(val) => {
                    setOpenItems(val)
                    setAllExpanded(val.length === event.itineraryDays.length)
                  }}
                  className="mt-2"
                >
                  {event.itineraryDays.map((day, i) => (
                    <AccordionItem key={i} value={`day-${i}`} className="border-border">
                      <AccordionTrigger
                        className="text-sm font-semibold text-[#735c38] sm:text-base"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {day.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p
                          className="text-sm leading-relaxed text-[#735c38]/80 sm:text-base"
                          style={{ fontFamily: 'var(--font-body)' }}
                        >
                          {day.content}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* Gallery 2 - Placeholder images */}
              <div className="mt-12">
                <ImageCarousel images={['/placeholder.svg?height=600&width=1200', '/placeholder.svg?height=600&width=1200', '/placeholder.svg?height=600&width=1200']} alt={`${event.title} accommodation`} />
              </div>

              {/* Package Inclusions */}
              <div id={sectionIds.inclusions} className="mt-12 scroll-mt-28">
                <h3
                  className="text-base font-bold uppercase tracking-wide text-[#22333b] sm:text-lg"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Package Inclusions:
                </h3>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  {/* Includes */}
                  <div className="border border-[#d9d9d9] bg-[#f5f5f5] p-6">
                    <h4
                      className="text-sm font-bold uppercase tracking-wider text-[#22333b]"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      Includes:
                    </h4>
                    <ul className="mt-4 flex flex-col gap-3">
                      {event.includes.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-[#22333b]"
                          style={{ fontFamily: 'var(--font-body)' }}
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#495c48]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Excludes */}
                  <div className="border border-[#d9d9d9] bg-[#f5f5f5] p-6">
                    <h4
                      className="text-sm font-bold uppercase tracking-wider text-[#22333b]"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      Excludes:
                    </h4>
                    <ul className="mt-4 flex flex-col gap-3">
                      {event.excludes.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-[#22333b]"
                          style={{ fontFamily: 'var(--font-body)' }}
                        >
                          <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div id={sectionIds.pricing} className="mt-12 scroll-mt-28">
                <h3
                  className="text-base font-bold uppercase tracking-wide text-[#735c38] sm:text-lg"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Pricing
                </h3>
                <p
                  className="mt-3 text-sm leading-relaxed text-[#735c38]/80 sm:text-base"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {'Spaces for '}
                  {event.title.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                  {' are extremely limited. Reserve your place early to guarantee access to one of golf\'s most iconic sporting events.'}
                </p>

                <div className="mt-6 flex flex-col gap-4">
                  {event.pricingTiers.map((tier, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border border-[#d9d9d9] bg-[#f5f5f5] px-6 py-5"
                    >
                      <div>
                        <p
                          className="text-sm font-bold uppercase tracking-wider text-[#22333b]"
                          style={{ fontFamily: 'var(--font-body)' }}
                        >
                          {tier.name}
                        </p>
                        <p
                          className="mt-1 text-sm text-[#22333b]/80"
                          style={{ fontFamily: 'var(--font-body)' }}
                        >
                          from <span className="text-lg font-bold text-[#22333b]">{tier.price}</span>
                          <span className="text-[#22333b]/80">/golfer</span>
                        </p>
                      </div>
                      <Link
                        href={`/tournaments/${tournamentSlug}/${event.slug}/tickets?tier=${encodeURIComponent(tier.name)}`}
                        className="inline-block bg-[#495c48] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a4a3b]"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        Get Tickets
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
}
