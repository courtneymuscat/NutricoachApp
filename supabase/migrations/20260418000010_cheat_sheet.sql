-- ─── Cheat Sheet Food Exchange System ───────────────────────────────────────
-- Serve definitions: 1 protein ≈ 30g protein, 1 carb ≈ 20g carbs, 1 fat ≈ 10g fat (~100cal each)

create table if not exists cheat_sheet_foods (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  serving_desc  text,                         -- e.g. '135g raw', '60ml', '6 cubes'
  calories      numeric,
  protein_g     numeric default 0,
  carbs_g       numeric default 0,
  fat_g         numeric default 0,
  primary_category text not null,             -- 'protein','carb','fat','fruit','veg','free','condiment'
  secondary_categories text[] default '{}',  -- extra serves e.g. ARRAY['fat'] for chicken thigh
  subcategory   text,                         -- 'lean_protein','plant_protein','condiment_fat','condiment_carb','free_condiment'
  display_order int default 0,
  is_default    boolean default true,
  created_at    timestamptz default now()
);

-- Coach-level overrides: hide defaults, reorder, add custom foods
create table if not exists coach_cheat_sheet (
  id            uuid primary key default gen_random_uuid(),
  coach_id      uuid not null references profiles(id) on delete cascade,
  food_id       uuid references cheat_sheet_foods(id) on delete cascade, -- null = fully custom food
  is_hidden     boolean default false,
  display_order int,
  -- custom food fields (used when food_id is null)
  name          text,
  serving_desc  text,
  calories      numeric,
  protein_g     numeric,
  carbs_g       numeric,
  fat_g         numeric,
  primary_category text,
  secondary_categories text[] default '{}',
  subcategory   text,
  created_at    timestamptz default now(),
  unique(coach_id, food_id)
);

-- Per-client serve targets set by coach
create table if not exists client_serve_targets (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references profiles(id) on delete cascade,
  coach_id       uuid not null references profiles(id),
  protein_serves numeric default 0,
  carb_serves    numeric default 0,
  fat_serves     numeric default 0,
  fruit_serves   numeric default 0,
  veg_unlimited  boolean default true,
  notes          text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique(client_id)
);

-- RLS
alter table cheat_sheet_foods enable row level security;
alter table coach_cheat_sheet enable row level security;
alter table client_serve_targets enable row level security;

-- cheat_sheet_foods: readable by all authenticated users
create policy "cheat_sheet_foods_read" on cheat_sheet_foods
  for select using (auth.role() = 'authenticated');

-- coach_cheat_sheet: coach owns their rows
create policy "coach_cheat_sheet_select" on coach_cheat_sheet
  for select using (coach_id = auth.uid());
create policy "coach_cheat_sheet_insert" on coach_cheat_sheet
  for insert with check (coach_id = auth.uid());
create policy "coach_cheat_sheet_update" on coach_cheat_sheet
  for update using (coach_id = auth.uid());
create policy "coach_cheat_sheet_delete" on coach_cheat_sheet
  for delete using (coach_id = auth.uid());

-- client_serve_targets: coach can manage, client can read their own
create policy "serve_targets_coach" on client_serve_targets
  for all using (coach_id = auth.uid());
create policy "serve_targets_client_read" on client_serve_targets
  for select using (client_id = auth.uid());
