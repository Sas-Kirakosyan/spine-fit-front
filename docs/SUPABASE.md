# Supabase Integration

SpineFit web app uses Supabase for authentication and cloud storage of user plans and quiz answers.

## Client Setup

**File:** `apps/web/src/lib/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }
);
```

Required env vars in `apps/web/.env`:
```
VITE_SUPABASE_URL=<project-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
```

---

## Authentication

**File:** `apps/web/src/lib/authService.ts`

| Function | Description |
|----------|-------------|
| `signUpWithEmail(email, password)` | Creates a new Supabase Auth user. Returns `{ user, requiresEmailConfirmation }`. |
| `signInWithEmail(email, password)` | Signs in an existing user. Returns `{ user }`. |
| `getCurrentUser()` | Returns the currently authenticated user or `null`. |

**Auth state hook:** `apps/web/src/hooks/useAuth.ts`

Subscribes to `supabase.auth.onAuthStateChange()` and exposes:
```typescript
type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: User; session: Session }
  | { status: "unauthenticated" };
```

`App.tsx` uses this hook to:
- Redirect unauthenticated users away from protected pages.
- Call `fetchPlan()` when a user authenticates (loads their plan from Supabase).
- Call `retryPendingQuizSync()` to flush any quiz answers that failed to save before login.
- Call `resetLocalCache()` on logout to prevent data leakage between users on shared devices.

**Registration flow:** `RegistrationForm` → `signUpWithEmail` → `onSuccess` callback navigates to quiz/home.

**Login flow:** `LoginPage` → `signInWithEmail` → `fetchPlan()` → navigate to workout if plan exists, otherwise home.

---

## Row Level Security (RLS)

Both tables have RLS enabled. All policies use `auth.uid() = user_id`, meaning Supabase enforces ownership at the database level regardless of what the client sends in query parameters. A user can only read, write, or delete their own row.

Migration: `supabase/migrations/20260424000000_enable_rls.sql`

To apply manually (Supabase SQL editor):
```sql
-- user_plans
alter table user_plans enable row level security;
create policy "user_plans: select own row"  on user_plans for select  using (auth.uid() = user_id);
create policy "user_plans: insert own row"  on user_plans for insert  with check (auth.uid() = user_id);
create policy "user_plans: update own row"  on user_plans for update  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_plans: delete own row"  on user_plans for delete  using (auth.uid() = user_id);

-- quiz_answers
alter table quiz_answers enable row level security;
create policy "quiz_answers: select own row"  on quiz_answers for select  using (auth.uid() = user_id);
create policy "quiz_answers: insert own row"  on quiz_answers for insert  with check (auth.uid() = user_id);
create policy "quiz_answers: update own row"  on quiz_answers for update  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quiz_answers: delete own row"  on quiz_answers for delete  using (auth.uid() = user_id);
```

> **Note:** The client still passes `.eq("user_id", userId)` in queries — this is a performance filter only (avoids a full table scan). The RLS policy is the actual security boundary.

---

## Database Tables

### `user_plans`

Stores each user's generated training plan and plan settings. Protected by RLS — each user can only access their own row.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid (PK) | References `auth.users.id` |
| `plan` | jsonb | Serialized `GeneratedPlan` object |
| `settings` | jsonb | Serialized `PlanSettings` object |

**File:** `apps/web/src/lib/planService.ts`

Key functions:

| Function | Description |
|----------|-------------|
| `savePlan(plan)` | Caches plan in memory and queues an upsert to Supabase. |
| `savePlanSettings(settings)` | Saves settings and upserts alongside the current plan. |
| `savePlanAndSettings(plan, settings?)` | Combined single upsert. |
| `fetchPlan()` | Loads plan and settings from Supabase into in-memory cache. Called on login. |
| `clearPlan()` | Clears cache and deletes the row from Supabase. |
| `getPlan()` | Returns a deep copy of the cached plan. |
| `getPlanSettings()` | Returns cached settings or defaults. |

**Key patterns in planService:**
- In-memory cache avoids redundant DB reads during a session.
- Serialized write queue (`pendingWrite` chain) prevents out-of-order upserts when saves are triggered in rapid succession.
- `hasUnsyncedLocalChanges` flag prevents a stale server fetch from overwriting local changes that haven't finished syncing.

### `quiz_answers`

Stores the user's onboarding quiz answers so plans can be regenerated without re-taking the quiz.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid (PK) | References `auth.users.id` |
| `workout_type` | text | Quiz workout type selection |
| `answers` | jsonb | All quiz answer values |
| `units` | jsonb | Measurement unit preferences |

**File:** `apps/web/src/lib/quizStorage.ts`

| Function | Description |
|----------|-------------|
| `saveQuizToSupabase(userId, quiz)` | Upserts quiz data. Retries once after 1 s on failure. |
| `retryPendingQuizSync(userId)` | Reads `pendingQuizSync` from localStorage and retries any failed save. |

**Offline pattern:** If the user completes the quiz before logging in, the quiz is saved to `localStorage` under the `pendingQuizSync` key. On next login, `retryPendingQuizSync` flushes it to Supabase.

---

## What Is NOT in Supabase (Still localStorage-only)

| Data | Where stored | Notes |
|------|-------------|-------|
| Body profile (gender, DOB, height, weight) | `localStorage` (`bodyProfile`) | Read from quiz answers question #3 |
| Language / theme preferences | `localStorage` | Settings page only |
| Saved custom programs | `localStorage` (`savedPrograms`) | No DB table yet |
| Workout history | `localStorage` (`workoutHistory`) | No DB table yet |
| Mobile app auth | Not wired | `expo-auth-session` installed but unused |

---

## Logout

Logout is handled in `SettingsPage`:
1. `supabase.auth.signOut()` — invalidates the session.
2. `resetLocalCache()` — clears the in-memory plan/settings cache in `planService`.
3. Relevant localStorage keys are cleared (plan, quiz, history).
4. App navigates back to the home/login page.
