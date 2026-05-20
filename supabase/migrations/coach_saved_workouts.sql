-- Saved workouts library
--
-- Coaches can save any single program day as a reusable workout template
-- and pull it back into a program later. Org owners (or coaches assigned
-- to an org) can additionally publish a saved workout as an org template
-- so other coaches in the same org can use it.
--
-- The `content` jsonb stores the same day shape used inside a program:
--   { name: string, items: PDayItem[] }
-- where each PDayItem is either an exercise or a section (matching the
-- program editor's data model).

CREATE TABLE IF NOT EXISTS coach_saved_workouts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id            uuid REFERENCES organisations(id) ON DELETE SET NULL,
  is_org_template   boolean NOT NULL DEFAULT false,
  name              text NOT NULL,
  description       text,
  content           jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coach_saved_workouts_coach_idx
  ON coach_saved_workouts (coach_id, created_at DESC);

CREATE INDEX IF NOT EXISTS coach_saved_workouts_org_template_idx
  ON coach_saved_workouts (org_id, created_at DESC)
  WHERE is_org_template = true;

ALTER TABLE coach_saved_workouts ENABLE ROW LEVEL SECURITY;

-- Coach can manage their own saved workouts
CREATE POLICY "coach_manage_own_saved_workouts" ON coach_saved_workouts
  FOR ALL USING (coach_id = auth.uid());

-- Coaches in the same org can read org templates published by anyone in
-- that org. They cannot edit/delete — that policy is the owner-manage
-- one above.
CREATE POLICY "org_members_read_saved_workout_templates" ON coach_saved_workouts
  FOR SELECT USING (
    is_org_template = true
    AND org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = coach_saved_workouts.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.is_active = true
    )
  );

-- Touch trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION touch_coach_saved_workouts_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS coach_saved_workouts_touch ON coach_saved_workouts;
CREATE TRIGGER coach_saved_workouts_touch
  BEFORE UPDATE ON coach_saved_workouts
  FOR EACH ROW EXECUTE FUNCTION touch_coach_saved_workouts_updated_at();
