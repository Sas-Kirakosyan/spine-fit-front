-- Reference migration — apply manually via Supabase SQL Editor (not using Supabase CLI).
-- Enable Row Level Security on both tables.
-- Every policy uses auth.uid() so Supabase enforces ownership at the DB level
-- regardless of what the client sends in query parameters.

-- ─── user_plans ──────────────────────────────────────────────────────────────

alter table user_plans enable row level security;

create policy "user_plans: select own row"
  on user_plans for select
  using (auth.uid() = user_id);

create policy "user_plans: insert own row"
  on user_plans for insert
  with check (auth.uid() = user_id);

create policy "user_plans: update own row"
  on user_plans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_plans: delete own row"
  on user_plans for delete
  using (auth.uid() = user_id);

-- ─── quiz_answers ─────────────────────────────────────────────────────────────

alter table quiz_answers enable row level security;

create policy "quiz_answers: select own row"
  on quiz_answers for select
  using (auth.uid() = user_id);

create policy "quiz_answers: insert own row"
  on quiz_answers for insert
  with check (auth.uid() = user_id);

create policy "quiz_answers: update own row"
  on quiz_answers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "quiz_answers: delete own row"
  on quiz_answers for delete
  using (auth.uid() = user_id);
