import { createClient } from '@/lib/supabase/server'
import { getUserType } from '@/lib/supabase/get-user-type'
import { type NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: tripId } = await params
  const supabase = await createClient()

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

  // ── 1. Update trip record ──────────────────────────────────────────
  const updateData: Record<string, any> = {
    title: body.title,
    description: body.description,
    refund_policy: body.refund_policy || null,
    location: body.location,
    continent: body.continent,
    price_regular: body.price_regular,
    max_guests: body.max_guests,
    max_nights: body.max_nights || body.max_days,
    min_nights: body.min_nights || body.min_days || 1,
    min_days_advance: body.min_days_advance,
    highlights: body.highlights,
    overview_content: body.overview_content,
    courses_photo_url: body.courses_photo_url,
    room_photo_url: body.room_photo_url,
    show_from_price: body.show_from_price ?? false,
    updated_at: new Date().toISOString(),
  }

  if ('title_ko' in body) updateData.title_ko = body.title_ko
  if ('description_ko' in body) updateData.description_ko = body.description_ko
  if ('refund_policy_ko' in body)
    updateData.refund_policy_ko = body.refund_policy_ko
  if ('location_ko' in body) updateData.location_ko = body.location_ko
  if ('highlights_ko' in body) updateData.highlights_ko = body.highlights_ko
  if ('overview_content_ko' in body)
    updateData.overview_content_ko = body.overview_content_ko

  const { error: tripError } = await supabase
    .from('trips')
    .update(updateData)
    .eq('id', tripId)

  if (tripError) {
    console.error('[v0] Error updating custom trip:', tripError)
    return NextResponse.json({ error: tripError.message }, { status: 500 })
  }

  // ── 2. Update packages ─────────────────────────────────────────────
  if (body.packages) {
    await supabase.from('packages').delete().eq('trip_id', tripId)

    const validPackages = body.packages.filter((pkg: any) => pkg.name?.trim())
    if (validPackages.length > 0) {
      const packagesToInsert = validPackages.map((pkg: any) => ({
        trip_id: tripId,
        name: pkg.name,
        description: pkg.description || null,
        price: pkg.price || 0,
        price_per_extra_night: pkg.price_per_extra_night || null,
        availability: pkg.availability || 'unlimited',
        quantity: pkg.availability === 'limited' ? pkg.quantity : null,
        participants_per_booking: pkg.participants_per_booking || 1,
      }))

      const { error: pkgError } = await supabase
        .from('packages')
        .insert(packagesToInsert)
      if (pkgError) console.error('Error updating packages:', pkgError)
    }
  }

  // ── 3. Update golf courses ─────────────────────────────────────────
  if (body.golf_courses) {
    await supabase.from('trip_golf_courses').delete().eq('trip_id', tripId)

    const validCourses = body.golf_courses.filter((c: any) =>
      c.course_name?.trim(),
    )
    if (validCourses.length > 0) {
      const { error } = await supabase.from('trip_golf_courses').insert(
        validCourses.map((c: any) => ({
          trip_id: tripId,
          course_name: c.course_name,
          description: c.description || null,
          max_rounds: c.max_rounds || 5,
          num_holes: c.num_holes || 18,
        })),
      )
      if (error) console.error('Error updating golf courses:', error)
    }
  }

  // ── 4. Update course images ────────────────────────────────────────
  if (Array.isArray(body.course_images)) {
    await supabase.from('trip_images').delete().eq('trip_id', tripId)

    const photos = body.course_images
      .slice(0, 5)
      .filter((url: string) => url && url.trim())
      .map((url: string, idx: number) => ({
        trip_id: tripId,
        image_url: url,
        display_order: idx,
      }))

    if (photos.length > 0) {
      const { error } = await supabase.from('trip_images').insert(photos)
      if (error) console.error('Error updating course photos:', error)
    }
  }

  // ── 5. Update meal options ─────────────────────────────────────────
  if (body.meal_options) {
    await supabase.from('trip_meal_options').delete().eq('trip_id', tripId)

    const valid = body.meal_options.filter((m: any) => m.name?.trim())
    if (valid.length > 0) {
      const { error } = await supabase.from('trip_meal_options').insert(
        valid.map((m: any) => ({
          trip_id: tripId,
          name: m.name,
          description: m.description || null,
          is_included: m.is_included || false,
        })),
      )
      if (error) console.error('Error updating meal options:', error)
    }
  }

  // ── 6. Update transportation options ───────────────────────────────
  if (body.transportation_options) {
    await supabase
      .from('trip_transportation_options')
      .delete()
      .eq('trip_id', tripId)

    const valid = body.transportation_options.filter((t: any) => t.name?.trim())
    if (valid.length > 0) {
      const { error } = await supabase
        .from('trip_transportation_options')
        .insert(
          valid.map((t: any) => ({
            trip_id: tripId,
            name: t.name,
            description: t.description || null,
            is_included: t.is_included || false,
          })),
        )
      if (error) console.error('Error updating transportation options:', error)
    }
  }

  // ── 7. Update service options ──────────────────────────────────────
  if (body.service_options) {
    await supabase.from('trip_service_options').delete().eq('trip_id', tripId)

    const valid = body.service_options.filter((s: any) => s.name?.trim())
    if (valid.length > 0) {
      const { error } = await supabase.from('trip_service_options').insert(
        valid.map((s: any) => ({
          trip_id: tripId,
          name: s.name,
          description: s.description || null,
          is_included: s.is_included || false,
        })),
      )
      if (error) console.error('Error updating service options:', error)
    }
  }

  // ── 8. Update inquiry record ───────────────────────────────────────
  if (body.inquiryId) {
    const inquiryUpdate: Record<string, any> = {
      trip_title: body.title,
      customer_name: body.customerName,
      customer_email: body.customerEmail,
      customer_phone: body.customerPhone,
      total_price: body.totalPrice,
      deposit_percentage: body.depositPercentage,
      custom_package_description: body.description || '',
    }

    if (body.startDate) {
      inquiryUpdate.start_date = new Date(body.startDate)
        .toISOString()
        .split('T')[0]
    }
    if (body.endDate) {
      inquiryUpdate.end_date = new Date(body.endDate)
        .toISOString()
        .split('T')[0]
    }
    if (body.remainderDueDate) {
      inquiryUpdate.remainder_due_date = new Date(body.remainderDueDate)
        .toISOString()
        .split('T')[0]
    } else if (body.depositPercentage === 100) {
      inquiryUpdate.remainder_due_date = null
    }

    const { error: inquiryError } = await supabase
      .from('inquiries')
      .update(inquiryUpdate)
      .eq('id', body.inquiryId)

    if (inquiryError) {
      console.error('[v0] Error updating inquiry:', inquiryError)
    }
  }

  // Auto-translation is intentionally NOT triggered on edit. Admins
  // should use the dedicated "Translate" dialog in the admin UI
  // (POST /api/admin/translate-trip/[id]) to re-translate after edits,
  // matching the behavior of regular trips and tournament events.

  return NextResponse.json({ success: true })
}
