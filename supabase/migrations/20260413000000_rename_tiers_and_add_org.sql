-- Step 5: Create organisations table (must exist before anything references it)
CREATE TABLE IF NOT EXISTS public.organisations (
  id uuid not null default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamp with time zone default now(),
  subscription_tier text not null default 'org_starter',
  stripe_customer_id text null,
  stripe_subscription_id text null,
  seat_limit integer not null default 3,
  client_limit integer not null default 150,
  logo_url text null,
  brand_colour text null,
  custom_domain text null,
  is_active boolean not null default true,
  constraint organisations_pkey primary key (id),
  constraint organisations_subscription_tier_check check (
    subscription_tier = any (array[
      'org_starter'::text,
      'org_enterprise'::text
    ])
  )
);

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

-- These two policies do NOT reference profiles.org_id so they can run now
CREATE POLICY "org owner can update"
  ON public.organisations FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "platform admin full access"
  ON public.organisations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'platform_admin'
    )
  );

-- Step 6: Create org_members table
CREATE TABLE IF NOT EXISTS public.org_members (
  id uuid not null default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'coach',
  permissions jsonb not null default '{}'::jsonb,
  invited_at timestamp with time zone default now(),
  accepted_at timestamp with time zone null,
  is_active boolean not null default true,
  constraint org_members_pkey primary key (id),
  constraint org_members_unique unique (org_id, user_id),
  constraint org_members_role_check check (
    role = any (array[
      'owner'::text,
      'admin'::text,
      'coach'::text
    ])
  )
);

ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- This policy does NOT reference profiles.org_id so it can run now
CREATE POLICY "org owner and admin can manage members"
  ON public.org_members FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND is_active = true
    )
  );

-- Step 1: Drop the old check constraint so data can be updated freely
ALTER TABLE public.profiles
DROP CONSTRAINT profiles_subscription_tier_check;

-- Step 2: Migrate existing data (must run before new constraint is added)
UPDATE public.profiles SET subscription_tier = 'individual_free'
  WHERE subscription_tier = 'tier_1' AND user_type = 'individual';
UPDATE public.profiles SET subscription_tier = 'individual_optimiser'
  WHERE subscription_tier = 'tier_2' AND user_type = 'individual';
UPDATE public.profiles SET subscription_tier = 'individual_elite'
  WHERE subscription_tier = 'tier_3' AND user_type = 'individual';
UPDATE public.profiles SET subscription_tier = 'coach_solo'
  WHERE subscription_tier = 'tier_1' AND user_type = 'coach';
UPDATE public.profiles SET subscription_tier = 'coach_pro'
  WHERE subscription_tier = 'tier_2' AND user_type = 'coach';
-- coached stays as-is

-- Step 1b: Add new constraint now that all rows have valid values
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_subscription_tier_check CHECK (
  subscription_tier = any (array[
    'individual_free'::text,
    'individual_optimiser'::text,
    'individual_elite'::text,
    'coached'::text,
    'coach_solo'::text,
    'coach_pro'::text,
    'coach_business'::text
  ])
);

-- Step 3: Add org_id and coach_discipline to profiles
-- profiles.org_id must exist before the two RLS policies below that reference it
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS org_id uuid null references public.organisations(id) on delete set null,
ADD COLUMN IF NOT EXISTS coach_discipline text null,
ADD COLUMN IF NOT EXISTS subscription_seat_count integer not null default 0,
ADD CONSTRAINT profiles_coach_discipline_check CHECK (
  coach_discipline is null or
  coach_discipline = any (array[
    'pt'::text,
    'nutrition'::text,
    'both'::text
  ])
);

-- Step 4: Add org_id to coach_clients
ALTER TABLE public.coach_clients
ADD COLUMN IF NOT EXISTS org_id uuid null references public.organisations(id) on delete set null;

CREATE INDEX IF NOT EXISTS coach_clients_org_id_idx
  ON public.coach_clients(org_id);

-- RLS policies that reference profiles.org_id — must run after Step 3
CREATE POLICY "org members can view their org"
  ON public.organisations FOR SELECT
  USING (
    id IN (
      SELECT org_id FROM public.profiles
      WHERE id = auth.uid() AND org_id IS NOT NULL
    )
  );

CREATE POLICY "org members can view teammates"
  ON public.org_members FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles
      WHERE id = auth.uid() AND org_id IS NOT NULL
    )
  );
