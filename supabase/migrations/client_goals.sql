create table if not exists client_goals (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid references profiles(id) on delete cascade not null,
  client_id   uuid references profiles(id) on delete cascade not null,
  main_goal   text,
  mini_goals  text[] not null default '{}',
  updated_at  timestamptz not null default now(),
  unique(coach_id, client_id)
);

alter table client_goals enable row level security;

-- Coach can read and write their own client goals
create policy "coach_manage_goals" on client_goals
  for all using (coach_id = auth.uid());

-- Client can read their own goals
create policy "client_read_goals" on client_goals
  for select using (client_id = auth.uid());
