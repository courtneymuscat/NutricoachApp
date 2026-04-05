ALTER TABLE public.client_meal_plans
  ADD COLUMN IF NOT EXISTS end_date date;
