'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, ChevronRight } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useTranslations } from '@/lib/i18n/provider'
import { getLocalizedField } from '@/lib/i18n/get-localized-field'

type ItineraryDay = {
  id: string
  display_order: number
  title: string
  title_ko?: string | null
  title_de?: string | null
  content: string | null
  content_ko?: string | null
  content_de?: string | null
}

type GalleryImage = {
  id: string
  image_url: string
  display_order: number
  gallery_type: string | null
}

type PricingTier = {
  id: string
  name: string
  name_ko?: string | null
  name_de?: string | null
  price: string | null
  display_order: number | null
  description?: string | null
}

type TournamentEvent = {
  id: string
  slug: string
  title: string
  title_ko?: string | null
  title_de?: string | null
  location: string
  location_ko?: string | null
  location_de?: string | null
  date: string
  duration: string | null
  description: string[] | null
  description_ko?: string[] | null
  description_de?: string[] | null
  trip_highlights: string[] | null
  trip_highlights_ko?: string[] | null
  trip_highlights_de?: string[] | null
  travel_itinerary: string[] | null
  travel_itinerary_ko?: string[] | null
  travel_itinerary_de?: string[] | null
  includes: string[] | null
  includes_ko?: string[] | null
  includes_de?: string[] | null
  excludes: string[] | null
  excludes_ko?: string[] | null
  excludes_de?: string[] | null
  image: string | null
  hero_image: string | null
  tournament_event_itinerary_days: ItineraryDay[]
  tournament_event_gallery_images: GalleryImage[]
  tournament_event_pricing_tiers: PricingTier[]
  venue?: string | null
}

interface EventDetailViewProps {
  event: TournamentEvent
  tournamentSlug: string
  tournamentHeroImage: string
  locale?: string
}

function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [current, setCurrent] = useState(0)

  if (images.length === 0) return null

  return (
    <div className="relative">
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <img
          src={images[current]}
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

export function EventDetailView({
  event,
  tournamentSlug,
  tournamentHeroImage,
  locale = 'en',
}: EventDetailViewProps) {
  const t = useTranslations('tournaments')
  const itineraryDays = event.tournament_event_itinerary_days || []
  const galleryImages = event.tournament_event_gallery_images || []
  const pricingTiers = event.tournament_event_pricing_tiers || []

  // Get localized fields for the event
  const eventTitle = getLocalizedField(event as any, 'title', locale) as string
  const eventLocation = getLocalizedField(event as any, 'location', locale) as string
  const eventDescription = getLocalizedField(event as any, 'description', locale, true) as string[] | null
  const eventHighlights = getLocalizedField(event as any, 'trip_highlights', locale, true) as string[] | null
  const eventIncludes = getLocalizedField(event as any, 'includes', locale, true) as string[] | null
  const eventExcludes = getLocalizedField(event as any, 'excludes', locale, true) as string[] | null

  const [allExpanded, setAllExpanded] = useState(false)
  const [openItems, setOpenItems] = useState<string[]>(['day-0'])

  const handleExpandAll = () => {
    if (allExpanded) {
      setOpenItems([])
      setAllExpanded(false)
    } else {
      setOpenItems(itineraryDays.map((_, i) => `day-${i}`))
      setAllExpanded(true)
    }
  }

  // Use the date string directly from database (it's already formatted)
  const formattedDate = event.date

  // Title casing helper
  const titleCase = (str: string) =>
    str
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')

  // Separate gallery images by type
  const eventGalleryImages = galleryImages.filter(
    (img) => img.gallery_type === 'event' || !img.gallery_type
  )
  const hotelGalleryImages = galleryImages.filter(
    (img) => img.gallery_type === 'hotel'
  )

  const sectionLabels = {
    highlights: t('tripHighlights'),
    itinerary: t('travelItinerary'),
    includes: t('whatsIncluded'),
    accommodations: t('accommodations'),
    pricing: t('packages'),
  }

  const sectionIds = {
    highlights: 'trip-highlights',
    itinerary: 'travel-itinerary',
    includes: 'whats-included',
    accommodations: 'accommodations',
    pricing: 'pricing',
  }

  return (
    <div>
      {/* Hero Banner - always use the tournament-level hero image */}
      <section className="relative h-[40vh] sm:h-[45vh] md:h-[50vh] w-full">
        <img
          src={tournamentHeroImage || '/placeholder.svg'}
          alt={eventTitle}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <p
            className="text-xs font-bold uppercase tracking-[0.25em] text-white/90 sm:text-sm"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {formattedDate}
          </p>
          <h1
            className="mt-3 text-center text-3xl italic text-white sm:text-4xl md:text-5xl lg:text-6xl text-balance"
            style={{ fontFamily: 'var(--font-display-alt)' }}
          >
            {titleCase(eventTitle)}
          </h1>
        </div>
      </section>

      {/* Mobile Sidebar - On This Page (visible below lg) */}
      <div className="bg-[#f2f0eb] px-4 py-6 sm:px-6 lg:hidden">
        <p
          className="text-sm font-bold uppercase tracking-wider text-[#2c2c2c]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {t('onThisPage')}
        </p>
        <hr className="mt-3 border-[#d5d0c7]" />
        <nav className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
          {[
            { label: sectionLabels.highlights, id: sectionIds.highlights },
            { label: sectionLabels.itinerary, id: sectionIds.itinerary },
            { label: sectionLabels.includes, id: sectionIds.includes },
            ...(hotelGalleryImages.length > 0
              ? [{ label: sectionLabels.accommodations, id: sectionIds.accommodations }]
              : []),
            { label: sectionLabels.pricing, id: sectionIds.pricing },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="flex items-center gap-2 text-sm text-[#2c2c2c] transition-colors hover:text-[#495c48]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#8a8272]" />
              <span className="underline underline-offset-2 decoration-[#8a8272]">
                {item.label}
              </span>
            </a>
          ))}
        </nav>
        <div className="mt-5">
          <Link
            href="/contact"
            className="inline-block bg-[#495c48] px-8 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#3a4a3b]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {t('contactUs')}
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
                {t('onThisPage')}
              </p>
              <hr className="mt-3 border-[#d5d0c7]" />
              <nav className="mt-5 flex flex-col gap-5">
                {[
                  { label: sectionLabels.highlights, id: sectionIds.highlights },
                  { label: sectionLabels.itinerary, id: sectionIds.itinerary },
                  { label: sectionLabels.includes, id: sectionIds.includes },
                  ...(hotelGalleryImages.length > 0
                    ? [{ label: sectionLabels.accommodations, id: sectionIds.accommodations }]
                    : []),
                  { label: sectionLabels.pricing, id: sectionIds.pricing },
                ].map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="flex items-center gap-3 text-sm text-[#2c2c2c] transition-colors hover:text-[#495c48]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#8a8272]" />
                    <span className="underline underline-offset-2 decoration-[#8a8272]">
                      {item.label}
                    </span>
                  </a>
                ))}
              </nav>
              <div className="mt-8">
                <Link
                  href="/contact"
                  className="inline-block w-full bg-[#495c48] px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#3a4a3b]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {t('contactUs')}
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
              {titleCase(eventTitle)}
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#735c38]">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#735c38]" />
                {eventLocation}
                {event.venue && ` - ${event.venue}`}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#735c38]" />
                {formattedDate}
              </span>
            </div>

            {/* Description */}
            {eventDescription && eventDescription.length > 0 && (
              <div className="mt-6 flex flex-col gap-4">
                {eventDescription.map((desc, idx) => (
                  <p
                    key={idx}
                    className="text-sm leading-relaxed text-[#735c38] sm:text-base"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {desc}
                  </p>
                ))}
              </div>
            )}

            {/* Gallery */}
            {eventGalleryImages.length > 0 && (
              <div className="mt-10">
                <ImageCarousel
                  images={eventGalleryImages.map((img) => img.image_url)}
                  alt={eventTitle}
                />
              </div>
            )}

            {/* Trip Highlights */}
            {eventHighlights && eventHighlights.length > 0 && (
              <div id={sectionIds.highlights} className="mt-12 scroll-mt-28">
                <h3
                  className="text-base font-bold uppercase tracking-wide text-[#735c38] sm:text-lg"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {t('tripHighlights')}:
                </h3>
                <ul className="mt-4 space-y-2">
                  {eventHighlights.map((highlight, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm leading-relaxed text-[#735c38]/80 sm:text-base"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#735c38]/60" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Travel Itinerary */}
            {itineraryDays.length > 0 && (
              <div id={sectionIds.itinerary} className="mt-12 scroll-mt-28">
                <h3
                  className="text-base font-bold uppercase tracking-wide text-[#735c38] sm:text-lg"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {t('travelItinerary')}:
                </h3>

                {/* Expand All */}
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={handleExpandAll}
                    className="text-sm font-medium text-[#735c38] underline underline-offset-2 transition-colors hover:text-[#735c38]/80"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {allExpanded ? t('collapseAllDays') : t('expandAllDays')}
                  </button>
                </div>

                {/* Day-by-Day Accordion */}
                <Accordion
                  type="multiple"
                  value={openItems}
                  onValueChange={(val) => {
                    setOpenItems(val)
                    setAllExpanded(val.length === itineraryDays.length)
                  }}
                  className="mt-2"
                >
                  {itineraryDays
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((day, i) => {
                      const dayTitle = getLocalizedField(day as any, 'title', locale) as string
                      const dayContent = getLocalizedField(day as any, 'content', locale) as string
                      return (
                        <AccordionItem
                          key={day.id}
                          value={`day-${i}`}
                          className="border-border"
                        >
                          <AccordionTrigger
                            className="text-sm font-semibold text-[#735c38] sm:text-base"
                            style={{ fontFamily: 'var(--font-body)' }}
                          >
                            {t('day')} {i + 1}: {dayTitle}
                          </AccordionTrigger>
                          <AccordionContent>
                            <p
                              className="text-sm leading-relaxed text-[#735c38]/80 sm:text-base"
                              style={{ fontFamily: 'var(--font-body)' }}
                            >
                              {dayContent || t('detailsComingSoon')}
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                </Accordion>
              </div>
            )}

            {/* What's Included / Excluded */}
            {((eventIncludes && eventIncludes.length > 0) ||
              (eventExcludes && eventExcludes.length > 0)) && (
              <div id={sectionIds.includes} className="mt-12 scroll-mt-28">
                <h3
                  className="text-base font-bold uppercase tracking-wide text-[#735c38] sm:text-lg"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {t('whatsIncluded')}:
                </h3>

                {eventIncludes && eventIncludes.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {eventIncludes.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-sm leading-relaxed text-[#735c38]/80 sm:text-base"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        <span className="mt-1 text-green-600">&#10003;</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {eventExcludes && eventExcludes.length > 0 && (
                  <>
                    <h3
                      className="mt-6 text-base font-bold uppercase tracking-wide text-[#735c38] sm:text-lg"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {t('whatsNotIncluded')}:
                    </h3>
                    <ul className="mt-4 space-y-2">
                      {eventExcludes.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 text-sm leading-relaxed text-[#735c38]/80 sm:text-base"
                          style={{ fontFamily: 'var(--font-body)' }}
                        >
                          <span className="mt-1 text-red-600">&#10007;</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* Hotel / Accommodations Gallery */}
            {hotelGalleryImages.length > 0 && (
              <div id={sectionIds.accommodations} className="mt-12 scroll-mt-28">
                <h3
                  className="text-base font-bold uppercase tracking-wide text-[#735c38] sm:text-lg"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {t('accommodations')}:
                </h3>
                <div className="mt-4">
                  <ImageCarousel
                    images={hotelGalleryImages.map((img) => img.image_url)}
                    alt={`${eventTitle} accommodations`}
                  />
                </div>
              </div>
            )}

            {/* Packages */}
            {pricingTiers.length > 0 && (
              <div id={sectionIds.pricing} className="mt-12 scroll-mt-28">
                <h3
                  className="text-base font-bold uppercase tracking-wide text-[#735c38] sm:text-lg"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {t('packages')}
                </h3>
                <p
                  className="mt-3 text-sm leading-relaxed text-[#735c38]/80 sm:text-base"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {titleCase(eventTitle)}
                  {t('packagesDescription')}
                </p>

                <div className="mt-6 flex flex-col gap-4">
                  {pricingTiers.map((tier) => {
                    const tierName = getLocalizedField(tier as any, 'name', locale) as string
                    return (
                      <div
                        key={tier.id}
                        className="flex items-center justify-between border border-[#d9d9d9] bg-[#f5f5f5] px-6 py-5"
                      >
                        <div>
                          <p
                            className="text-sm font-bold uppercase tracking-wider text-[#22333b]"
                            style={{ fontFamily: 'var(--font-body)' }}
                          >
                            {tierName}
                          </p>
                          {tier.description && (
                            <p
                              className="mt-1 text-xs text-[#735c38]/70"
                              style={{ fontFamily: 'var(--font-body)' }}
                            >
                              {tier.description}
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/tournaments/${tournamentSlug}/${event.slug}/tickets?tier=${encodeURIComponent(tier.name)}`}
                          className="inline-block bg-[#495c48] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a4a3b]"
                          style={{ fontFamily: 'var(--font-body)' }}
                        >
                          {t('getTickets')}
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
