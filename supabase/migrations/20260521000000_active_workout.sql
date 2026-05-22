-- Reference migration — apply via Supabase SQL Editor (Supabase MCP not available).
-- Mirrors the local in-progress workout (apps/web/src/storage/activeWorkoutStorage.ts)
-- so a reload / device handoff resumes exactly where the user left off.
-- One row per user; the SPA upserts the whole object on debounced state changes.

create table public.active_workout (
  user_id uuid primary key references auth.users(id) on delete cascade,
  workout_start_time bigint not null,                  -- epoch ms (absolute)
  workout_exercises jsonb not null default '[]'::jsonb, -- full exercise list (needed for cross-device hydrate, esp. custom workouts)
  completed_exercise_ids jsonb not null default '[]'::jsonb,
  exercise_logs jsonb not null default '{}'::jsonb,
  exercise_pain_levels jsonb not null default '{}'::jsonb,
  is_custom_workout boolean not null default false,
  paused_seconds integer not null default 0,
  last_active_at bigint not null,                       -- epoch ms (heartbeat)
  updated_at timestamptz not null default now()
);

alter table public.active_workout enable row level security;

create policy "active_workout: select own row"
  on active_workout for select
  using (auth.uid() = user_id);

create policy "active_workout: insert own row"
  on active_workout for insert
  with check (auth.uid() = user_id);

create policy "active_workout: update own row"
  on active_workout for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "active_workout: delete own row"
  on active_workout for delete
  using (auth.uid() = user_id);
