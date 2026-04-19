-- Coach food-serve tagging: links food DB entries to serve categories
-- This powers both the cheat sheet display AND the serve calculation on food logs

create table if not exists coach_food_serves (
  id                   uuid primary key default gen_random_uuid(),
  coach_id             uuid not null references profiles(id) on delete cascade,
  food_name            text not null,              -- matched against food_logs.food_name
  food_db_id           uuid,                       -- food_database.id (optional exact ref)
  serve_category       text not null,              -- 'protein','carb','fat','fruit','veg','free'
  secondary_categories text[] default '{}',        -- e.g. ARRAY['fat'] for salmon
  serving_desc         text,                       -- e.g. '135g raw' — for cheat sheet display
  calories_per_serve   numeric,
  protein_per_serve    numeric,
  carbs_per_serve      numeric,
  fat_per_serve        numeric,
  created_at           timestamptz default now(),
  unique(coach_id, food_name)
);

alter table coach_food_serves enable row level security;

create policy "coach_food_serves_select" on coach_food_serves
  for select using (coach_id = auth.uid());
create policy "coach_food_serves_insert" on coach_food_serves
  for insert with check (coach_id = auth.uid());
create policy "coach_food_serves_update" on coach_food_serves
  for update using (coach_id = auth.uid());
create policy "coach_food_serves_delete" on coach_food_serves
  for delete using (coach_id = auth.uid());
