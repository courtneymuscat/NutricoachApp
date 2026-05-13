-- Template provenance: track which org template a coach's personal copy came from
-- so the editor can show "Copied from org template" subtitle and warn coaches
-- that upstream changes won't propagate to their copy.

ALTER TABLE public.autoflow_templates
ADD COLUMN IF NOT EXISTS source_template_id uuid null;

ALTER TABLE public.programs
ADD COLUMN IF NOT EXISTS source_template_id uuid null;

ALTER TABLE public.meal_plans
ADD COLUMN IF NOT EXISTS source_template_id uuid null;

ALTER TABLE public.forms
ADD COLUMN IF NOT EXISTS source_template_id uuid null;

ALTER TABLE public.note_templates
ADD COLUMN IF NOT EXISTS source_template_id uuid null;

ALTER TABLE public.coach_resources
ADD COLUMN IF NOT EXISTS source_template_id uuid null;

-- No FK constraint: the source row may live in the same table and may be
-- deleted/unpublished later. Editors defensively check that the referenced
-- row still exists and is is_org_template=true before showing provenance.
