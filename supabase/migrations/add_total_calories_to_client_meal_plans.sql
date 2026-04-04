-- Run this in the Supabase SQL editor
ALTER TABLE public.client_meal_plans
  ADD COLUMN IF NOT EXISTS total_calories int NOT NULL DEFAULT 0;
