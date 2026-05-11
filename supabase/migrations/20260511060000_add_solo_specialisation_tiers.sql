-- Allow the new solo specialisation tiers on profiles.subscription_tier.
-- Without these the CHECK constraint silently rejected every paid signup
-- for Coach Solo PT and Coach Solo Nutrition, stranding those coaches on
-- individual_free.
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_subscription_tier_check CHECK (
  subscription_tier = any (array[
    'individual_free'::text,
    'individual_optimiser'::text,
    'individual_elite'::text,
    'coached'::text,
    'coach_solo'::text,
    'coach_pt_solo'::text,
    'coach_nutritionist_solo'::text,
    'coach_pro'::text,
    'coach_business'::text,
    'wl_starter'::text,
    'wl_pro'::text
  ])
);
