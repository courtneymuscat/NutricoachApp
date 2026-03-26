import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe, getStripePriceId } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { planKey, billing, userType } = await req.json() as {
      planKey: string
      billing: 'monthly' | 'annual'
      userType: 'individual' | 'coach'
    }

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const priceId = getStripePriceId(planKey, billing)
    if (!priceId) {
      return NextResponse.json({ error: 'Stripe price not configured for this plan yet.' }, { status: 400 })
    }

    const stripe = getStripe()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: session.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        userId: session.user.id,
        planKey,
        billing,
        userType,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          planKey,
          userType,
        },
      },
      success_url: `${baseUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
