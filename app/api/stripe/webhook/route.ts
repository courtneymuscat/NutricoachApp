import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'
import type Stripe from 'stripe'

// Plan key → subscription_tier mapping
const PLAN_KEY_TO_TIER: Record<string, string> = {
  individual_tier_1: 'tier_1',
  individual_tier_2: 'tier_2',
  individual_tier_3: 'tier_3',
  coach_starter: 'tier_1',
  coach_growth: 'tier_2',
}

const PLAN_KEY_TO_USER_TYPE: Record<string, string> = {
  individual_tier_1: 'individual',
  individual_tier_2: 'individual',
  individual_tier_3: 'individual',
  coach_starter: 'coach',
  coach_growth: 'coach',
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { userId, planKey, userType } = session.metadata ?? {}

    if (userId && planKey) {
      const tier = PLAN_KEY_TO_TIER[planKey] ?? 'tier_1'
      const resolvedUserType = userType ?? PLAN_KEY_TO_USER_TYPE[planKey] ?? 'individual'

      await supabase.from('profiles').update({
        subscription_tier: tier,
        user_type: resolvedUserType,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
      }).eq('id', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = subscription.customer as string

    // Find user by Stripe customer ID and downgrade to free tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('stripe_customer_id', customerId)
      .single()

    if (profile) {
      await supabase.from('profiles').update({
        subscription_tier: 'tier_1',
        stripe_subscription_id: null,
      }).eq('id', profile.id)
    }
  }

  return NextResponse.json({ received: true })
}
