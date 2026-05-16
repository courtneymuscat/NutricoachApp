-- Throttle column so the dashboard doesn't hit the Stripe API on every load.
-- The dashboard skips the sync if this is within the last hour.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_last_synced_at timestamptz;
