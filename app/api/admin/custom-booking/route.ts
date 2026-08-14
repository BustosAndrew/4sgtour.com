import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { getUserType } from '@/lib/supabase/get-user-type'
import { autoTranslateTrip, autoTranslatePackages } from '@/lib/auto-translate'
import { getSiteUrl } from '@/lib/site-url'
import { headers } from 'next/headers'
import Twilio from 'twilio'

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
      const headersList = await headers()
      const host = headersList.get('host') || 'localhost:3000'
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
      const baseUrl = `${protocol}://${host}`

      const useEnglishAsSource = hasEnglishContent

      autoTranslateTrip(
        baseUrl,
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
      ).catch((err) => console.error('[v0] Background translation error:', err))

      const { data: insertedPackages } = await supabase
        .from('packages')
        .select('id, name, description')
        .eq('trip_id', tripData.id)

      if (insertedPackages && insertedPackages.length > 0) {
        autoTranslatePackages(
          baseUrl,
          insertedPackages,
          useEnglishAsSource ? 'en' : 'ko',
          supabase,
        ).catch((err) =>
          console.error('[v0] Background package translation error:', err),
        )
      }
    }

    // ── 9. Calculate deposit & create Stripe checkout sessions ─────────
    const totalPrice = pkgs[0].price
    const depPct = depositPercentage || 100
    const depositAmountCents = Math.round(((totalPrice * depPct) / 100) * 100)
    const depositAmountDollars = depositAmountCents / 100
    const fullAmountCents = Math.round(totalPrice * 100)

    const appUrl = getSiteUrl()

    // Create deposit payment session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${title} (${depPct === 100 ? 'Full Payment' : `${depPct}% Deposit`})`,
              description: description || `Custom package for ${customerName}`,
            },
            unit_amount: depositAmountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/bookings?success=true`,
      cancel_url: `${appUrl}/trips`,
      customer_email: customerEmail,
      payment_method_types: ['card', 'us_bank_account'],
      metadata: {
        site_url: appUrl,
        is_custom_package: 'true',
        trip_id: tripData.id,
        custom_package_name: title,
        total_price: totalPrice.toString(),
        deposit_percentage: depPct.toString(),
        payment_type: 'deposit',
        remainder_due_date: remainderDueDate || '',
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        start_date: startDate || '',
        end_date: endDate || '',
        created_by_admin: user.id,
        payment_method: 'sms_link',
      },
      expires_at: Math.floor(Date.now() / 1000) + 86400 * 3,
    })

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create payment link' },
        { status: 500 },
      )
    }

    // Create full payment session if deposit percentage is less than 100%
    let fullPaymentSession: { url: string | null; id: string } | null = null
    if (depPct < 100) {
      fullPaymentSession = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${title} (Full Payment)`,
                description: description || `Custom package for ${customerName}`,
              },
              unit_amount: fullAmountCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${appUrl}/bookings?success=true`,
        cancel_url: `${appUrl}/trips`,
        customer_email: customerEmail,
        payment_method_types: ['card', 'us_bank_account'],
        metadata: {
          site_url: appUrl,
          is_custom_package: 'true',
          trip_id: tripData.id,
          custom_package_name: title,
          total_price: totalPrice.toString(),
          deposit_percentage: '100',
          payment_type: 'full',
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          start_date: startDate || '',
          end_date: endDate || '',
          created_by_admin: user.id,
          payment_method: 'sms_link',
        },
        expires_at: Math.floor(Date.now() / 1000) + 86400 * 3,
      })
    }

    // ── 10. Create inquiry record linked to the trip ──────────────────
    const inquiryData: Record<string, any> = {
      site_url: appUrl,
      trip_id: tripData.id,
      trip_title: title,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      package_name: 'Custom Package',
      start_date: startDate
        ? new Date(startDate).toISOString().split('T')[0]
        : null,
      end_date: endDate ? new Date(endDate).toISOString().split('T')[0] : null,
      add_ons: [],
      rounds: 0,
      additional_requests: description || '',
      total_price: totalPrice,
      guests: [],
      status: 'contacted',
      payment_link: session.url,
      stripe_session_id: session.id,
      payment_link_sent_at: new Date().toISOString(),
      is_custom_package: true,
      custom_package_description: description || '',
      remainder_due_date: remainderDueDate
        ? new Date(remainderDueDate).toISOString().split('T')[0]
        : null,
      deposit_percentage: depPct,
    }

    // Add full payment link if available (for deposit < 100%)
    if (fullPaymentSession?.url) {
      inquiryData.remainder_payment_link = fullPaymentSession.url
    }

    const { data: inquiryRecord, error: inquiryError } = await supabase
      .from('inquiries')
      .insert(inquiryData)
      .select()
      .single()

    if (inquiryError) {
      console.error(
        '[v0] Error creating inquiry for custom booking:',
        inquiryError,
      )
    }

    // ── 11. Send SMS via Twilio ───────────────────────────────────────
    try {
      const twilioClient = Twilio(
        process.env.TWILIO_ACCOUNT_SID!,
        process.env.TWILIO_AUTH_TOKEN!,
      )

      // Link to the package page where customers can choose between deposit and full payment
      const packagePageUrl = inquiryRecord 
        ? `${appUrl}/package/${inquiryRecord.id}`
        : session.url
      
      const paymentDescription =
        depPct === 100
          ? `full payment ($${totalPrice.toFixed(2)})`
          : fullPaymentSession 
            ? `${depPct}% deposit or full payment`
            : `${depPct}% deposit ($${depositAmountDollars.toFixed(2)})`

      await twilioClient.messages.create({
        to: customerPhone,
        from: process.env.TWILIO_PHONE_NUMBER!,
        body: `4 Seasons Golf Tour: Your payment link for ${title} is ready. Complete your ${paymentDescription} here: ${packagePageUrl} Reply STOP to opt out.`,
      })
    } catch (smsError) {
      console.error('[v0] Error sending SMS:', smsError)
    }

    return NextResponse.json({
      success: true,
      paymentLink: session.url,
      fullPaymentLink: fullPaymentSession?.url || null,
      sessionId: session.id,
      tripId: tripData.id,
      inquiryId: inquiryRecord?.id,
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
