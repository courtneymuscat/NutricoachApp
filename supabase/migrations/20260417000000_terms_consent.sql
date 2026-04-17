-- Add terms consent tracking columns to profiles.
-- terms_accepted_at: timestamp when the user accepted the ToS at signup.
-- terms_version: identifies which version of the ToS was accepted (e.g. 'april_2026').

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone null,
  ADD COLUMN IF NOT EXISTS terms_version text null;
