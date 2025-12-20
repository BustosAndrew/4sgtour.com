"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface TripImageGalleryProps {
  images: string[]
  title: string
}

export function TripImageGallery({ images, title }: TripImageGalleryProps) {
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)

  if (images.length === 0) return null

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Main large image */}
        <div className="relative aspect-[3/2] w-full overflow-hidden">
          <Image
            src={images[0] || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover"
          />
        </div>

        {/* Two smaller images in a row */}
        {images.length > 1 && (
          <div className="grid grid-cols-2 gap-3">
            {images.slice(1, 3).map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (idx === 1 && images.length > 2) {
                    setGalleryIndex(0)
                    setGalleryOpen(true)
                  }
                }}
                className="relative aspect-[4/3] w-full overflow-hidden"
              >
                <Image
                  src={img || "/placeholder.svg"}
                  alt={`${title} ${idx + 2}`}
                  fill
                  className="object-cover"
                />
                {idx === 1 && images.length > 2 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors hover:bg-black/50">
                    <span className="text-sm font-medium text-white">
                      + {images.length - 2} Photos
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Gallery Popup */}
      {galleryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setGalleryOpen(false)}
        >
          <div
            className="relative h-full w-full flex items-center justify-center p-4 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setGalleryOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 sm:right-8 sm:top-8"
              aria-label="Close gallery"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Main image container */}
            <div className="relative w-full max-w-6xl">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg shadow-2xl">
                <Image
                  src={images[galleryIndex] || "/placeholder.svg"}
                  alt={`${title} ${galleryIndex + 1}`}
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryIndex((prev) =>
                        prev === 0 ? images.length - 1 : prev - 1,
                      )
                    }
                    className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 sm:left-4 sm:h-12 sm:w-12"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryIndex((prev) =>
                        prev === images.length - 1 ? 0 : prev + 1,
                      )
                    }
                    className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 sm:right-4 sm:h-12 sm:w-12"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </>
              )}

              {/* Image counter and title */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 sm:p-6">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-white/80 sm:text-base">
                      {title}
                    </p>
                  </div>
                  <div className="rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm">
                    {galleryIndex + 1} / {images.length}
                  </div>
                </div>
              </div>

              {/* Thumbnail strip for desktop */}
              {images.length > 1 && (
                <div className="mt-4 hidden sm:flex gap-2 justify-center overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setGalleryIndex(idx)}
                      className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded transition-all ${
                        idx === galleryIndex
                          ? "ring-2 ring-white ring-offset-2 ring-offset-black/50 scale-105"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={img || "/placeholder.svg"}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
