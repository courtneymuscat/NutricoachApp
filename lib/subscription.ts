import { createClient } from '@/lib/supabase/server'
import { canAccess, TIER_FEATURES, COACH_TIER_FEATURES, type Feature, type SubscriptionTier, type UserType } from '@/lib/features'

export type Subscription = {
  tier: SubscriptionTier
  userType: UserType
  canAccess: (feature: Feature) => boolean
}

const DEFAULTS: Subscription = {
  tier: 'individual_free',
  userType: 'individual',
  canAccess: (f) => canAccess(f, 'individual_free', 'individual'),
}

export async function getSubscription(): Promise<Subscription> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return DEFAULTS

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, user_type')
    .eq('id', user.id)
    .single()

  const tier = (profile?.subscription_tier as SubscriptionTier | null) ?? 'individual_free'
  const userType = (profile?.user_type as UserType | null) ?? 'individual'

  // Coaches get their coach-specific features plus full elite individual features
  const features = userType === 'coach'
    ? [...(COACH_TIER_FEATURES[tier] ?? []), ...TIER_FEATURES['individual_elite']]
    : (TIER_FEATURES[tier] ?? TIER_FEATURES['individual_free'])

  return {
    tier,
    userType,
    canAccess: (f) => features.includes(f),
  }
}
