import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
  'http://localhost:3000'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const returnPath = typeof body?.returnPath === 'string' ? body.returnPath : '/settings'

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
    }

    const stripe = getStripe()

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${BASE_URL}${returnPath}`,
      })
      return NextResponse.json({ url: session.url })
    } catch (stripeErr) {
      const msg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr)

      // Test/live mode mismatch — customer exists in the other mode
      if (msg.includes('similar object exists in test mode') || msg.includes('similar object exists in live mode')) {
        return NextResponse.json({
          error: 'billing_mode_mismatch',
          message: 'Your billing account was set up in test mode. Please subscribe again to activate live billing.',
        }, { status: 400 })
      }

      // Customer no longer exists in Stripe
      if (msg.includes('No such customer')) {
        return NextResponse.json({
          error: 'billing_customer_not_found',
          message: 'Your billing account could not be found. Please subscribe again.',
        }, { status: 400 })
      }

      throw stripeErr
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Stripe portal error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
