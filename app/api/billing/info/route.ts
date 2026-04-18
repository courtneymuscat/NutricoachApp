import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { INCLUDED_SEATS, INCLUDED_COACHES, CLIENT_OVERAGE_PRICE, COACH_OVERAGE_PRICE } from '@/lib/billing'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, stripe_subscription_id, stripe_customer_id, subscription_seat_count, org_coach_seat_count')
      .eq('id', user.id)
      .single()

    const tier = profile?.subscription_tier ?? 'individual_free'
    const stripeCustomerId = profile?.stripe_customer_id as string | null
    const stripeSubscriptionId = profile?.stripe_subscription_id as string | null

    let next_billing_date: string | null = null
    let valid_stripe_customer = false
    let overage_items: Array<{ label: string; amount: number }> = []

    if (stripeCustomerId) {
      try {
        const stripe = getStripe()

        // Validate the customer actually exists in the current Stripe mode
        // This catches test/live mode mismatches before the user hits the portal
        await stripe.customers.retrieve(stripeCustomerId)
        valid_stripe_customer = true

        if (stripeSubscriptionId) {
          const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId)
          const periodEnd = sub.items.data[0]?.current_period_end
          if (periodEnd) {
            next_billing_date = new Date(periodEnd * 1000).toISOString()
          }
        }
      } catch {
        // Customer doesn't exist in this Stripe mode (test/live mismatch or deleted)
        valid_stripe_customer = false
      }
    }

    // Build overage breakdown for coach plans
    const seatCount = (profile?.subscription_seat_count as number) ?? 0
    const coachSeatCount = (profile?.org_coach_seat_count as number) ?? 0
    const includedClients = INCLUDED_SEATS[tier] ?? 0
    const includedCoaches = INCLUDED_COACHES[tier] ?? 0
    const clientOverageRate = CLIENT_OVERAGE_PRICE[tier] ?? 0
    const coachOverageRate = COACH_OVERAGE_PRICE[tier] ?? 0

    const extraClients = Math.max(0, seatCount - includedClients)
    const extraCoaches = Math.max(0, coachSeatCount - includedCoaches)

    if (extraClients > 0 && clientOverageRate > 0) {
      overage_items.push({
        label: `${extraClients} extra client${extraClients > 1 ? 's' : ''} × $${clientOverageRate}/mo`,
        amount: extraClients * clientOverageRate,
      })
    }
    if (extraCoaches > 0 && coachOverageRate > 0) {
      overage_items.push({
        label: `${extraCoaches} extra coach${extraCoaches > 1 ? 'es' : ''} × $${coachOverageRate}/mo`,
        amount: extraCoaches * coachOverageRate,
      })
    }

    return NextResponse.json({
      subscription_tier: tier,
      next_billing_date,
      has_stripe_customer: valid_stripe_customer,
      seat_count: seatCount,
      included_seats: includedClients,
      coach_seat_count: coachSeatCount,
      included_coaches: includedCoaches,
      client_overage_rate: clientOverageRate,
      coach_overage_rate: coachOverageRate,
      overage_items,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
