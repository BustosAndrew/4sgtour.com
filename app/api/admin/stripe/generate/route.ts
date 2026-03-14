import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { tripId } = body

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID required' }, { status: 400 })
    }

    // Get trip with packages
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, title, packages(*)')
      .eq('id', tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const packages = trip.packages || []
    const results: any[] = []

    for (const pkg of packages) {
      // Skip if already has Stripe IDs
      if (pkg.stripe_product_id && pkg.stripe_price_id) {
        results.push({
          packageId: pkg.id,
          name: pkg.name,
          status: 'skipped',
          message: 'Already has Stripe configuration',
        })
        continue
      }

      try {
        // Create Stripe Product
        const product = await stripe.products.create({
          name: `${trip.title} - ${pkg.name}`,
          description: pkg.description || `${pkg.name} package for ${trip.title}`,
          metadata: {
            trip_id: trip.id,
            package_id: pkg.id,
            package_name: pkg.name,
          },
        })

        // Create Stripe Price (30% deposit)
        const depositAmount = Math.round(pkg.price * 0.3 * 100) // Convert to cents
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: depositAmount,
          currency: 'usd',
          metadata: {
            trip_id: trip.id,
            package_id: pkg.id,
            deposit_percentage: '30',
            full_price: pkg.price.toString(),
          },
        })

        // Update package with Stripe IDs
        const { error: updateError } = await supabase
          .from('packages')
          .update({
            stripe_product_id: product.id,
            stripe_price_id: price.id,
          })
          .eq('id', pkg.id)

        if (updateError) {
          throw updateError
        }

        results.push({
          packageId: pkg.id,
          name: pkg.name,
          status: 'created',
          stripeProductId: product.id,
          stripePriceId: price.id,
          depositAmount: depositAmount / 100,
        })
      } catch (error: any) {
        console.error(`[v0] Error creating Stripe config for package ${pkg.id}:`, error)
        results.push({
          packageId: pkg.id,
          name: pkg.name,
          status: 'error',
          message: error.message,
        })
      }
    }

    // Enable stripe payment for the trip
    const { error: tripUpdateError } = await supabase
      .from('trips')
      .update({ stripe_payment_enabled: true })
      .eq('id', tripId)

    if (tripUpdateError) {
      console.error('[v0] Error enabling stripe payment for trip:', tripUpdateError)
    }

    return NextResponse.json({
      success: true,
      tripId,
      results,
    })
  } catch (error: any) {
    console.error('[v0] Error generating Stripe configuration:', error)
    return NextResponse.json(
      { error: 'Failed to generate Stripe configuration' },
      { status: 500 },
    )
  }
}
