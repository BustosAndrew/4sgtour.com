"use client"

import { useState, useRef, useEffect } from "react"
import { COUNTRIES, type Country } from "@/lib/countries"
import { ChevronDown } from "lucide-react"

interface CountryCodeSelectorProps {
  value: Country
  onChange: (country: Country) => void
  className?: string
}

export function CountryCodeSelector({ value, onChange, className = "" }: CountryCodeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filteredCountries = COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(search.toLowerCase()) ||
      country.dialCode.includes(search) ||
      country.code.toLowerCase().includes(search.toLowerCase()),
  )

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const FlagIcon = ({ country }: { country: Country }) => <span className="text-xl leading-none">{country.flag}</span>

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center gap-1 bg-[#ffffff] border border-[#d9d9d9] text-[#22333b] px-2 rounded-md text-sm font-medium hover:bg-[#eae0d6]/30 transition-colors h-11"
      >
        <FlagIcon country={value} />
        <ChevronDown className={`h-3 w-3 text-[#735c38] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && <div className="fixed top-0 left-0 w-screen h-screen z-40" onClick={() => setIsOpen(false)} />}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:absolute sm:inset-auto sm:top-full sm:left-0 sm:mt-1 sm:p-0">
          <div className="absolute inset-0 bg-black/20 sm:hidden" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#ffffff] border border-[#d9d9d9] rounded-md shadow-lg overflow-hidden flex flex-col max-h-[70vh] sm:max-h-64 sm:w-80">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#ffffff] border-b border-[#d9d9d9] text-[#22333b] placeholder:text-[#735c38]/50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#735c38]"
            />
            <div className="overflow-y-auto">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    onChange(country)
                    setIsOpen(false)
                    setSearch("")
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-[#eae0d6]/30 transition-colors ${
                    value.code === country.code ? "bg-[#eae0d6]/50" : ""
                  }`}
                >
                  <span className="flex-shrink-0">
                    <FlagIcon country={country} />
                  </span>
                  <span className="text-[#22333b] text-sm flex-1">{country.name}</span>
                  <span className="text-[#735c38] text-sm flex-shrink-0">{country.dialCode}</span>
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <div className="px-3 py-4 text-center text-[#735c38]/50 text-sm">No countries found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
