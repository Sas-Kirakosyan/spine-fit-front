-- Reference migration — apply via Supabase MCP / SQL Editor.
-- Tracks which (planId_dayNumber_dayName) workout IDs the user has completed
-- in the current rotation. One row per user; the SPA upserts the entire array.

create table public.user_completed_workouts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_completed_workouts enable row level security;

create policy "user_completed_workouts: select own row"
  on user_completed_workouts for select
  using (auth.uid() = user_id);

create policy "user_completed_workouts: insert own row"
  on user_completed_workouts for insert
  with check (auth.uid() = user_id);

create policy "user_completed_workouts: update own row"
  on user_completed_workouts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_completed_workouts: delete own row"
  on user_completed_workouts for delete
  using (auth.uid() = user_id);
