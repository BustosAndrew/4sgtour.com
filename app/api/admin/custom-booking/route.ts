import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserType } from '@/lib/supabase/get-user-type'
import {
  autoTranslateTrip,
  autoTranslatePackages,
  autoTranslateNamedRows,
} from '@/lib/auto-translate'
import { getSiteUrl } from '@/lib/site-url'
import Twilio from 'twilio'
import { normalizeE164 } from '@/lib/phone'
import { toCalendarDate } from '@/lib/calendar-date'
import { toCancellationSchedule } from '@/lib/cancellation-policy'
import { toCardFeePercent } from '@/lib/booking-price'
import { getDefaultCardFeePercent } from '@/lib/card-fee-settings'
import { getBalanceFlow, type BalanceFlow } from '@/lib/custom-package'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify admin auth
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userType = await getUserType()
    if (userType !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      refund_policy,
      overview_content,
      location,
      continent,
      max_guests,
      max_days,
      min_days_advance,
      min_days,
      courses_photo_url,
      course_images,
      room_photo_url,
      show_from_price,
      highlights,
      // Korean translations
      title_ko,
      description_ko,
      refund_policy_ko,
      overview_content_ko,
      location_ko,
      highlights_ko,
      // Packages & options
      packages: pkgs,
      golfCourses,
      mealOptions,
      transportationOptions,
      serviceOptions,
      // Customer info
      customerName,
      customerEmail,
      customerPhone,
      startDate,
      endDate,
      // Payment
      depositPercentage,
      remainderDueDate,
    } = body

    // Validate required fields
    if (
      !title ||
      !location ||
      !continent ||
      !customerName ||
      !customerEmail ||
      !customerPhone
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    // Texts go out through Twilio, which needs E.164 (the form builds it
    // from a country picker).
    const phone = normalizeE164(customerPhone)
    if (!phone) {
      return NextResponse.json(
        {
          error:
            'Customer phone must be a full international number, e.g. +82 10 1234 5678',
        },
        { status: 400 },
      )
    }

    if (Number(depositPercentage) < 100 && !toCalendarDate(remainderDueDate)) {
      return NextResponse.json(
        { error: 'A remainder due date is required when taking a deposit' },
        { status: 400 },
      )
    }

    if (!pkgs || pkgs.length === 0 || !pkgs[0].price) {
      return NextResponse.json(
        { error: 'At least one package with a price is required' },
        { status: 400 },
      )
    }

    // ── 1. Create the trip record (is_custom = true) ──────────────────
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    const slug = `${baseSlug}-${Date.now()}`

    const insertData: Record<string, any> = {
      title,
      description: description || null,
      refund_policy: refund_policy || null,
      overview_content: overview_content || null,
      location,
      continent,
      slug,
      price_regular: pkgs[0].price || 0,
      max_guests: max_guests || 20,
      max_nights: max_days || null,
      min_nights: min_days || 1,
      min_days_advance: min_days_advance || 0,
      courses_photo_url: courses_photo_url || null,
      room_photo_url: room_photo_url || null,
      highlights: highlights || [],
      show_from_price: show_from_price || false,
      cancellation_schedule: toCancellationSchedule(body.cancellation_schedule),
      // The form sends the package's own fee; without one, the site default.
      credit_card_fee_percent: toCardFeePercent(
        body.credit_card_fee_percent,
        await getDefaultCardFeePercent(supabase),
      ),
      is_payment_link_trip: false,
      is_custom: true,
    }

    if (title_ko) insertData.title_ko = title_ko
    if (description_ko) insertData.description_ko = description_ko
    if (refund_policy_ko) insertData.refund_policy_ko = refund_policy_ko
    if (overview_content_ko)
      insertData.overview_content_ko = overview_content_ko
    if (location_ko) insertData.location_ko = location_ko
    if (highlights_ko && highlights_ko.length > 0)
      insertData.highlights_ko = highlights_ko

    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .insert(insertData)
      .select()
      .single()

    if (tripError) {
      console.error('[v0] Error creating custom trip:', tripError.message)
      throw tripError
    }

    // ── 2. Create packages ────────────────────────────────────────────
    if (pkgs && pkgs.length > 0) {
      const packagesData = pkgs.map((pkg: any) => ({
        trip_id: tripData.id,
        name: pkg.name,
        description: pkg.description || null,
        price: pkg.price,
        price_per_extra_night: pkg.price_per_extra_night || null,
        availability: pkg.availability,
        quantity: pkg.quantity,
        participants_per_booking: pkg.participants_per_booking,
      }))

      const { error: packagesError } = await supabase
        .from('packages')
        .insert(packagesData)

      if (packagesError) {
        console.error('[v0] Error creating packages:', packagesError)
      }
    }

    // ── 3. Create golf courses ────────────────────────────────────────
    if (golfCourses && golfCourses.length > 0) {
      const golfCoursesData = golfCourses.map((course: any) => ({
        trip_id: tripData.id,
        course_name: course.course_name,
        max_rounds: Number(course.max_rounds),
        num_holes: Number(course.num_holes) || 18,
        description: course.description || null,
      }))

      const { error: golfCoursesError } = await supabase
        .from('trip_golf_courses')
        .insert(golfCoursesData)

      if (golfCoursesError) {
        console.error('[v0] Error creating golf courses:', golfCoursesError)
      }
    }

    // ── 4. Create course images ───────────────────────────────────────
    if (course_images && course_images.length > 0) {
      const coursePhotosData = course_images
        .slice(0, 5)
        .filter((url: string) => url && url.trim())
        .map((url: string, idx: number) => ({
          trip_id: tripData.id,
          image_url: url,
          display_order: idx,
        }))

      if (coursePhotosData.length > 0) {
        const { error: photosError } = await supabase
          .from('trip_images')
          .insert(coursePhotosData)

        if (photosError) {
          console.error('[v0] Error creating course photos:', photosError)
        }
      }
    }

    // ── 5. Create meal options ────────────────────────────────────────
    if (mealOptions && mealOptions.length > 0) {
      const mealOptionsData = mealOptions.map((meal: any) => ({
        trip_id: tripData.id,
        name: meal.name,
        description: meal.description || null,
        is_included: meal.is_included || false,
      }))

      const { error: mealsError } = await supabase
        .from('trip_meal_options')
        .insert(mealOptionsData)

      if (mealsError) {
        console.error('[v0] Error creating meal options:', mealsError)
      }
    }

    // ── 6. Create transportation options ──────────────────────────────
    if (transportationOptions && transportationOptions.length > 0) {
      const transportOptionsData = transportationOptions.map((t: any) => ({
        trip_id: tripData.id,
        name: t.name,
        description: t.description || null,
        is_included: t.is_included || false,
      }))

      const { error: transportError } = await supabase
        .from('trip_transportation_options')
        .insert(transportOptionsData)

      if (transportError) {
        console.error(
          '[v0] Error creating transportation options:',
          transportError,
        )
      }
    }

    // ── 7. Create service options ─────────────────────────────────────
    if (serviceOptions && serviceOptions.length > 0) {
      const serviceOptionsData = serviceOptions.map((s: any) => ({
        trip_id: tripData.id,
        name: s.name,
        description: s.description || null,
        is_included: s.is_included || false,
      }))

      const { error: serviceError } = await supabase
        .from('trip_service_options')
        .insert(serviceOptionsData)

      if (serviceError) {
        console.error('[v0] Error creating service options:', serviceError)
      }
    }

    // ── 8. Trigger auto-translation ───────────────────────────────────
    const hasEnglishContent = title && title.trim()
    const hasKoreanContent = title_ko && title_ko.trim()

    if (hasEnglishContent || hasKoreanContent) {
      const useEnglishAsSource = hasEnglishContent

      // Awaited rather than left floating. These used to be fire-and-
      // forget promises, but on Fluid Compute the instance can be frozen
      // once the response is sent, so work still in flight is liable to
      // be killed part-way — leaving a trip half-translated. Now that the
      // model is called in-process (no self-HTTP round-trips) this costs
      // far less wall-clock than the fan-out version did.
      await autoTranslateTrip(
        tripData.id,
        useEnglishAsSource
          ? {
              title,
              description,
              location,
              refund_policy,
              overview_content,
              highlights,
            }
          : {
              title: title_ko,
              description: description_ko,
              location: location_ko,
              refund_policy: refund_policy_ko,
              overview_content: overview_content_ko,
              highlights: highlights_ko,
            },
        useEnglishAsSource ? 'en' : 'ko',
        supabase,
      ).catch((err) => console.error('[v0] Translation error:', err))

      const { data: insertedPackages } = await supabase
        .from('packages')
        .select('id, name, description')
        .eq('trip_id', tripData.id)

      if (insertedPackages && insertedPackages.length > 0) {
        await autoTranslatePackages(
          insertedPackages,
          useEnglishAsSource ? 'en' : 'ko',
          supabase,
        ).catch((err) =>
          console.error('[v0] Package translation error:', err),
        )
      }
    }

    // Golf courses, meals, transport and services are shown to the customer
    // on /package/[id], so translate them too (fills only missing columns).
    // The admin form collects these in English only.
    for (const [table, nameField] of [
      ['trip_golf_courses', 'course_name'],
      ['trip_meal_options', 'name'],
      ['trip_transportation_options', 'name'],
      ['trip_service_options', 'name'],
    ] as const) {
      const { data: rows } = await supabase
        .from(table)
        .select('*')
        .eq('trip_id', tripData.id)
      if (rows && rows.length > 0) {
        await autoTranslateNamedRows(table, rows, nameField, 'en', supabase).catch(
          (err) => console.error(`[custom-booking] ${table} translation error:`, err),
        )
      }
    }

    // ── 9. Payment terms ──────────────────────────────────────────────
    // No Stripe session is created here. The customer pays from
    // /package/[id], which creates a fresh session on demand
    // (app/api/package/[id]/checkout): Stripe caps a session at 24 hours, and
    // a pre-made one would keep charging the old price after an admin edit.
    const totalPrice = Number(pkgs[0].price)
    const depPct = Number(depositPercentage) || 100
    const balanceFlow: BalanceFlow = getBalanceFlow(body.balanceFlow)

    const appUrl = getSiteUrl()
    const inquiryId = crypto.randomUUID()
    const packagePageUrl = `${appUrl}/package/${inquiryId}`

    // ── 10. Create inquiry record linked to the trip ──────────────────
    const inquiryData: Record<string, any> = {
      id: inquiryId,
      site_url: appUrl,
      trip_id: tripData.id,
      trip_title: title,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: phone,
      package_name: 'Custom Package',
      start_date: toCalendarDate(startDate),
      end_date: toCalendarDate(endDate),
      add_ons: [],
      rounds: 0,
      additional_requests: description || '',
      total_price: totalPrice,
      guests: [],
      status: 'contacted',
      // The customer's page — where every payment starts. Kept here so the
      // admin views and older code that read payment_link get a link that
      // never expires.
      payment_link: packagePageUrl,
      payment_link_sent_at: new Date().toISOString(),
      is_custom_package: true,
      custom_package_description: description || '',
      remainder_due_date: depPct < 100 ? toCalendarDate(remainderDueDate) : null,
      deposit_percentage: depPct,
      balance_flow: depPct < 100 ? balanceFlow : null,
    }

    const { error: inquiryError } = await supabase
      .from('inquiries')
      .insert(inquiryData)

    if (inquiryError) {
      // Without the inquiry the customer has no page to pay from.
      console.error(
        '[custom-booking] Error creating inquiry for custom booking:',
        inquiryError,
      )
      return NextResponse.json(
        {
          error: `The trip was saved, but the customer's package page could not be created: ${inquiryError.message}`,
          tripId: tripData.id,
        },
        { status: 500 },
      )
    }

    // ── 11. Text the customer their package page ──────────────────────
    const paymentDescription =
      depPct === 100
        ? `full payment ($${totalPrice.toFixed(2)})`
        : `${depPct}% deposit ($${((totalPrice * depPct) / 100).toFixed(2)}) or full payment`

    let smsSent = false
    let smsError: string | null = null
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE_NUMBER
    ) {
      smsError = 'Twilio is not configured on this deployment.'
    } else {
      try {
        const twilioClient = Twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN,
        )
        await twilioClient.messages.create({
          to: phone,
          from: process.env.TWILIO_PHONE_NUMBER,
          body: `4 Seasons Golf Tour: Your custom package "${title}" is ready. Review it and complete your ${paymentDescription} here: ${packagePageUrl} Reply STOP to opt out.`,
        })
        smsSent = true
      } catch (error: any) {
        console.error('[custom-booking] Error sending SMS:', error)
        smsError = error?.message || 'The text message could not be sent.'
      }
    }

    // The admin is told whether the text went out; if not, the form shows
    // the link to send another way.
    return NextResponse.json({
      success: true,
      packagePageUrl,
      smsSent,
      smsError,
      tripId: tripData.id,
      inquiryId,
    })
  } catch (error) {
    console.error('[v0] Error creating custom booking:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create custom booking',
      },
      { status: 500 },
    )
  }
}
