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
- Call `fetchHistory()` and `fetchIds()` on login to load workout history and completed workout IDs from Supabase.
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

### `workout_history`

Stores each finished workout as an individual row. Protected by RLS — each user can only access their own rows.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | Stable ID generated client-side (`FinishedWorkoutSummary.id`) |
| `user_id` | uuid | References `auth.users.id` |
| `finished_at` | timestamptz | ISO timestamp when workout ended |
| `duration` | text | Human-readable duration string |
| `total_volume` | numeric | Total kg lifted |
| `exercise_count` | int | Number of exercises completed |
| `calories_burned` | numeric | Estimated kcal |
| `completed_exercises` | jsonb | Array of exercise IDs completed |
| `completed_exercise_logs` | jsonb | Per-exercise set/rep/weight logs |
| `average_pain_level` | numeric (nullable) | Average pain score, null if not reported |

**File:** `apps/web/src/lib/workoutHistoryService.ts`

| Function | Description |
|----------|-------------|
| `addWorkout(summary)` | Appends to in-memory cache, writes to `pendingWorkoutHistorySync` localStorage key, and enqueues a Supabase insert. |
| `fetchHistory()` | Retries any pending inserts, fetches all rows from Supabase, and merges still-pending local entries so nothing is lost during network failures. |
| `getHistory()` | Returns the in-memory cache synchronously. |
| `resetLocalCache()` | Clears in-memory cache and both localStorage keys (cache + pending queue). Called on logout. |

**Offline pattern:** Failed inserts are persisted to `localStorage` under `pendingWorkoutHistorySync`. `fetchHistory()` and `retryPending()` re-attempt these on every fetch, focus, or login event.

**Cache initialization:** The in-memory cache starts as `[]` at module load — it is never pre-filled from localStorage on startup to avoid showing a previous user's data before auth resolves.

---

### `user_completed_workouts`

Stores the set of workout-day IDs the user has marked complete. One row per user; the full ID array is overwritten on every update (no per-row history).

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid (PK) | References `auth.users.id` |
| `ids` | jsonb | JSON array of completed workout-day ID strings |
| `updated_at` | timestamptz | Last write timestamp |

**File:** `apps/web/src/lib/completedWorkoutsService.ts`

| Function | Description |
|----------|-------------|
| `setIds(ids)` | Replaces the full set, writes to localStorage, and enqueues a Supabase upsert. |
| `fetchIds()` | Awaits any in-flight upsert then loads the authoritative set from Supabase. |
| `getIds()` | Returns the in-memory set synchronously. |
| `resetLocalCache()` | Clears in-memory cache and localStorage key. Called on logout. |

**Key patterns:**
- Serialized write queue (`upsertQueue`) prevents out-of-order upserts on rapid successive `setIds` calls.
- `hasUnsyncedLocalChanges` flag prevents `fetchIds()` from overwriting local changes that haven't finished syncing. The flag is reset on both success and failure so a network error never permanently blocks the remote refresh.
- Cache starts as `[]` at module load — never pre-filled from localStorage — to avoid cross-user contamination before auth resolves.

> **Design note:** The entire ID array is stored as a single jsonb blob. There is no per-ID history or per-plan scoping. A schema migration would be required to support individual ID queries or plan-scoped completion tracking.

---

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
| Body profile (height, weight) | `localStorage` (`bodyProfile`) | Gender and birth year are collected in the quiz only and not stored here |
| Language / theme preferences | `localStorage` | Settings page only |
| Saved custom programs | `localStorage` (`savedPrograms`) | No DB table yet |

---

## Mobile OAuth Redirect URLs (Expo)

Mobile auth lives in `apps/mobile/src/lib/authService.ts` (`signInWithGoogle`: PKCE + `WebBrowser.openAuthSessionAsync` + `exchangeCodeForSession`). The deep-link redirect must be allowed in **Auth → URL Configuration → Redirect URLs**, currently: `spinefit://auth-callback`, `spinefit://reset-password` (standalone/dev builds) and `exp://**` (Expo Go).

**Critical gotcha:** Supabase auth **hard-rejects any redirect URL whose host is an IP address** (loopback excepted) *before* consulting the allow-list — see `IsRedirectURLValid` in [supabase/auth `internal/utilities/request.go`](https://github.com/supabase/auth/blob/master/internal/utilities/request.go). Expo Go's default LAN URL (`exp://192.168.x.x:8081/--/…`) can therefore **never** be allow-listed. To test OAuth in Expo Go, start Metro in tunnel mode so the redirect host is a DNS name (covered by `exp://**`):

```bash
cd apps/mobile && pnpm start -- --tunnel
```

Alternative for Android over USB: `adb reverse tcp:8081 tcp:8081` and open the project via `exp://127.0.0.1:8081` (loopback is always accepted, no allow-list entry needed).

---

## Edge Functions

### `delete-self`

**File:** `supabase/functions/delete-self/index.ts`

Deletes the calling authenticated user's own `auth.users` row using the project's service role key. Used to undo the silent account creation that Supabase performs during `signInWithOAuth` when no account exists yet for the OAuth identity — without this, a user who clicks "Continue with Google" on the **Login** page (instead of Register) is silently registered.

**Security:** JWT verification is on (Supabase default). The function re-derives the uid from the access token via `getUser()` and passes that to `auth.admin.deleteUser()` — the caller cannot specify a different uid, so the only thing they can ever delete is themselves. The service role key is read from the auto-injected `SUPABASE_SERVICE_ROLE_KEY` env var and never leaves the function runtime.

**Client call site:** `deleteCurrentUserViaEdgeFunction()` in `apps/web/src/lib/authService.ts`, invoked from the post-OAuth handler in `App.tsx` when `oauthInProgress === "login"` and `isFreshlyCreatedUser(oauthUser)` is true. Must run **before** `signOut()` because the function needs the live session JWT.

**Deploy:**
```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy delete-self
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected into Edge Functions by Supabase — no manual env var setup needed.

---

## Logout

Logout is handled in `SettingsPage`:
1. `supabase.auth.signOut()` — invalidates the session.
2. `resetLocalCache()` — clears the in-memory plan/settings cache in `planService`.
3. Relevant localStorage keys are cleared (plan, quiz, history).
4. App navigates back to the home/login page.
