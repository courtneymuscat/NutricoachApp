import { createClient } from '@/lib/supabase/server'
import { canAccess, type Feature, type SubscriptionTier, type UserType } from '@/lib/features'

export type Subscription = {
  tier: SubscriptionTier
  userType: UserType
  canAccess: (feature: Feature) => boolean
}

const DEFAULTS: Subscription = {
  tier: 'tier_1',
  userType: 'individual',
  canAccess: (f) => canAccess(f, 'tier_1'),
}

/**
 * Server-side helper — call from Server Components or Route Handlers.
 * Falls back to tier_1 / individual if the profile row doesn't exist yet.
 *
 * Usage:
 *   const sub = await getSubscription()
 *   if (!sub.canAccess(FEATURES.MEAL_BUILDER)) redirect('/pricing')
 */
export async function getSubscription(): Promise<Subscription> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return DEFAULTS

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, user_type')
    .eq('id', session.user.id)
    .single()

  const tier = (profile?.subscription_tier as SubscriptionTier | null) ?? 'tier_1'
  const userType = (profile?.user_type as UserType | null) ?? 'individual'

  return {
    tier,
    userType,
    canAccess: (f) => canAccess(f, tier),
  }
}
