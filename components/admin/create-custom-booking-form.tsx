"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  ChevronRight,
  ChevronLeft,
  CalendarIcon,
  Check,
  Package,
  User,
  CreditCard,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const STEPS = [
  {
    id: 1,
    title: "Package Details",
    description: "Name, description, and pricing",
    icon: Package,
  },
  {
    id: 2,
    title: "Customer Info",
    description: "Contact details",
    icon: User,
  },
  {
    id: 3,
    title: "Travel Dates",
    description: "Trip dates and duration",
    icon: CalendarIcon,
  },
  {
    id: 4,
    title: "Payment & Review",
    description: "Deposit and send payment link",
    icon: CreditCard,
  },
]

interface CreateCustomBookingFormProps {
  onCancel: () => void
  onSuccess: () => void
}

export function CreateCustomBookingForm({
  onCancel,
  onSuccess,
}: CreateCustomBookingFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Step 1: Package Details
  const [packageName, setPackageName] = useState("")
  const [packageDescription, setPackageDescription] = useState("")
  const [totalPrice, setTotalPrice] = useState<number>(0)

  // Step 2: Customer Info
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")

  // Step 3: Travel Dates
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  // Step 4: Payment
  const [depositPercentage, setDepositPercentage] = useState(30)
  const [remainderDueDate, setRemainderDueDate] = useState<Date | undefined>(
    undefined
  )

  const depositAmount = (totalPrice * depositPercentage) / 100
  const remainderAmount = totalPrice - depositAmount

  const validateCurrentStep = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    switch (currentStep) {
      case 1:
        if (!packageName.trim()) errors.push("Package name is required")
        if (!totalPrice || totalPrice <= 0)
          errors.push("Total price must be greater than 0")
        break
      case 2:
        if (!customerName.trim()) errors.push("Customer name is required")
        if (!customerEmail.trim()) errors.push("Customer email is required")
        if (!customerPhone.trim()) errors.push("Customer phone is required")
        // Basic email validation
        if (customerEmail && !customerEmail.includes("@"))
          errors.push("Please enter a valid email")
        break
      case 3:
        if (!startDate) errors.push("Start date is required")
        if (!endDate) errors.push("End date is required")
        if (startDate && endDate && startDate > endDate)
          errors.push("End date must be after start date")
        break
      case 4:
        if (depositPercentage < 100 && !remainderDueDate)
          errors.push("Remainder due date is required when not paying full price")
        break
    }

    return { valid: errors.length === 0, errors }
  }

  const nextStep = () => {
    const validation = validateCurrentStep()
    if (!validation.valid) {
      setValidationErrors(validation.errors)
      return
    }
    setValidationErrors([])
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    setValidationErrors([])
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    const validation = validateCurrentStep()
    if (!validation.valid) {
      setValidationErrors(validation.errors)
      return
    }

    setLoading(true)
    setValidationErrors([])

    try {
      const response = await fetch("/api/admin/custom-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageName,
          packageDescription,
          totalPrice,
          customerName,
          customerEmail,
          customerPhone,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          depositPercentage,
          remainderDueDate: remainderDueDate?.toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create custom booking")
      }

      onSuccess()
    } catch (error) {
      console.error("[v0] Error creating custom booking:", error)
      setValidationErrors([
        error instanceof Error ? error.message : "Failed to create booking",
      ])
    } finally {
      setLoading(false)
    }
  }

  const canProceedToNextStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return packageName.trim() !== "" && totalPrice > 0
      case 2:
        return (
          customerName.trim() !== "" &&
          customerEmail.trim() !== "" &&
          customerPhone.trim() !== ""
        )
      case 3:
        return startDate !== undefined && endDate !== undefined
      case 4:
        return depositPercentage === 100 || remainderDueDate !== undefined
      default:
        return true
    }
  }

  // Success Dialog
  if (showSuccess) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Custom Booking Created!
          </h2>
          <p className="mt-2 text-muted-foreground">
            The payment link has been sent to {customerName} via SMS.
          </p>

          {packagePageUrl && (
            <div className="mt-6 w-full max-w-md">
              <Label className="text-left block mb-2">Private Package Page URL</Label>
              <p className="text-xs text-muted-foreground mb-2 text-left">
                Share this link with the customer. It is private and will not appear in search results.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={packagePageUrl}
                  readOnly
                  className="flex-1 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(packagePageUrl)}
                  className="shrink-0"
                >
                  {copiedUrl ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(packagePageUrl, "_blank")}
                  className="shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowSuccess(false)
                onSuccess()
              }}
            >
              Back to Inquiries
            </Button>
            <Button
              type="button"
              onClick={() => {
                // Reset form for new booking
                setShowSuccess(false)
                setPackagePageUrl(null)
                setCurrentStep(1)
                setPackageName("")
                setPackageDescription("")
                setTotalPrice(0)
                setCustomerName("")
                setCustomerEmail("")
                setCustomerPhone("")
                setStartDate(undefined)
                setEndDate(undefined)
                setDepositPercentage(30)
                setRemainderDueDate(undefined)
              }}
              className="bg-primary hover:bg-primary/90"
            >
              Create Another Booking
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id

            return (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : isCompleted
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isActive || isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="hidden text-xs text-muted-foreground sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 h-0.5 flex-1",
                      currentStep > step.id ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="mb-2 font-medium text-destructive">
            Please fix the following errors:
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm text-destructive">
            {validationErrors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Step Content */}
      <div className="min-h-[400px]">
        {/* Step 1: Package Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Custom Package Details</h2>
              <p className="text-muted-foreground">
                Enter the details for this custom package
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="packageName">Package Name *</Label>
                <Input
                  id="packageName"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="e.g., Custom Thailand Golf Experience"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="packageDescription">Description</Label>
                <Textarea
                  id="packageDescription"
                  value={packageDescription}
                  onChange={(e) => setPackageDescription(e.target.value)}
                  placeholder="Describe the custom package details, inclusions, etc."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalPrice">Total Price (USD) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="totalPrice"
                    type="number"
                    value={totalPrice || ""}
                    onChange={(e) => setTotalPrice(Number(e.target.value))}
                    placeholder="0.00"
                    className="pl-7"
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Customer Info */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Customer Information</h2>
              <p className="text-muted-foreground">
                Enter the customer&apos;s contact details
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Full Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email Address *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
                <p className="text-xs text-muted-foreground">
                  Payment link will be sent via SMS to this number
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Travel Dates */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Travel Dates</h2>
              <p className="text-muted-foreground">
                Select the trip start and end dates
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) =>
                        date < new Date() || (startDate ? date < startDate : false)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {startDate && endDate && (
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">
                  Trip Duration:{" "}
                  <span className="font-medium text-foreground">
                    {Math.ceil(
                      (endDate.getTime() - startDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) + 1}{" "}
                    days
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Payment & Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Payment & Review</h2>
              <p className="text-muted-foreground">
                Set the payment amount and review the booking details
              </p>
            </div>

            {/* Payment Amount Section */}
            <div className="space-y-4 rounded-lg border border-border p-4">
              <Label>Payment Amount</Label>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={depositPercentage === 30 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDepositPercentage(30)}
                >
                  30% Deposit
                </Button>
                <Button
                  type="button"
                  variant={depositPercentage === 50 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDepositPercentage(50)}
                >
                  50% Deposit
                </Button>
                <Button
                  type="button"
                  variant={depositPercentage === 100 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDepositPercentage(100)}
                >
                  Full Price
                </Button>
              </div>

              {/* Slider for fine-tuning */}
              <div className="flex items-center gap-4">
                <Slider
                  value={[depositPercentage]}
                  onValueChange={([value]) => setDepositPercentage(value)}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="w-16 text-right font-medium">
                  {depositPercentage}%
                </span>
              </div>

              {/* Display charge amount with clear messaging */}
              <div className="rounded-lg bg-muted/50 p-3">
                {depositPercentage === 100 ? (
                  <p className="text-sm font-medium">
                    Charging full price:{" "}
                    <span className="text-lg text-primary">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm">
                      Deposit amount:{" "}
                      <span className="font-medium text-primary">
                        ${depositAmount.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Remainder:{" "}
                      <span className="font-medium">
                        ${remainderAmount.toFixed(2)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Remainder Due Date - only shown when deposit < 100% */}
            {depositPercentage < 100 && (
              <div className="space-y-2">
                <Label>Remainder Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !remainderDueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {remainderDueDate
                        ? format(remainderDueDate, "PPP")
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={remainderDueDate}
                      onSelect={setRemainderDueDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Remaining balance of ${remainderAmount.toFixed(2)} will be due
                  by this date
                </p>
              </div>
            )}

            {/* Summary */}
            <div className="space-y-4 rounded-lg border border-border p-4">
              <h3 className="font-semibold">Booking Summary</h3>

              <div className="grid gap-3 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Package</span>
                  <span className="font-medium">{packageName}</span>
                </div>

                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{customerName}</span>
                </div>

                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{customerEmail}</span>
                </div>

                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{customerPhone}</span>
                </div>

                {startDate && endDate && (
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Travel Dates</span>
                    <span className="font-medium">
                      {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
                    </span>
                  </div>
                )}

                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Total Price</span>
                  <span className="font-medium">${totalPrice.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {depositPercentage === 100
                      ? "Amount to Charge"
                      : `Deposit (${depositPercentage}%)`}
                  </span>
                  <span className="font-bold text-primary">
                    ${depositAmount.toFixed(2)}
                  </span>
                </div>

                {depositPercentage < 100 && remainderDueDate && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Remainder Due</span>
                    <span>
                      ${remainderAmount.toFixed(2)} by{" "}
                      {format(remainderDueDate, "MMM d, yyyy")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="bg-transparent"
          >
            Cancel
          </Button>
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="bg-transparent"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}
        </div>

        {currentStep < 4 ? (
          <Button
            type="button"
            onClick={nextStep}
            disabled={!canProceedToNextStep()}
            className="w-full bg-primary hover:bg-primary/90 sm:w-auto"
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !canProceedToNextStep()}
            className="w-full bg-primary hover:bg-primary/90 sm:w-auto"
          >
            {loading ? "Creating & Sending..." : "Create Booking & Send Payment Link"}
          </Button>
        )}
      </div>
    </div>
  )
}
