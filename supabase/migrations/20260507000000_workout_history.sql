-- Reference migration — apply via Supabase MCP / SQL Editor (not the Supabase CLI).
-- One row per finished workout. id is text (not uuid) to tolerate the
-- `${Date.now()}` fallback in ActiveWorkoutPage when crypto.randomUUID is missing.

create table public.workout_history (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  finished_at timestamptz not null,
  duration text not null,
  total_volume numeric not null default 0,
  exercise_count integer not null default 0,
  calories_burned numeric not null default 0,
  completed_exercises jsonb not null,
  completed_exercise_logs jsonb not null,
  average_pain_level numeric,
  created_at timestamptz not null default now()
);

create index workout_history_user_finished_at_idx
  on public.workout_history (user_id, finished_at desc);

alter table public.workout_history enable row level security;

create policy "workout_history: select own rows"
  on workout_history for select
  using (auth.uid() = user_id);

create policy "workout_history: insert own rows"
  on workout_history for insert
  with check (auth.uid() = user_id);

create policy "workout_history: update own rows"
  on workout_history for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "workout_history: delete own rows"
  on workout_history for delete
  using (auth.uid() = user_id);
