-- Allow coaches to set a custom due date per step per client,
-- without modifying the shared template day_offset.
ALTER TABLE client_autoflow_step_overrides
  ADD COLUMN IF NOT EXISTS due_date date;
