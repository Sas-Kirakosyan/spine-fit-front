import type { Exercise } from "@/types/exercise";
import type { ExerciseSetRow } from "@/types/workout";
import type { PersistedActiveWorkout } from "@/storage/activeWorkoutStorage";
import { supabase } from "@/lib/supabase";

const TABLE = "active_workout";
const DEBOUNCE_MS = 5_000;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: PersistedActiveWorkout | null = null;
let upsertQueue: Promise<void> = Promise.resolve();
let hasUnsyncedLocalChanges = false;

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

interface ActiveWorkoutRow {
  user_id: string;
  workout_start_time: number;
  workout_exercises: unknown;
  completed_exercise_ids: unknown;
  exercise_logs: unknown;
  exercise_pain_levels: unknown;
  is_custom_workout: boolean;
  paused_seconds: number;
  last_active_at: number;
  updated_at: string;
}

function toRow(state: PersistedActiveWorkout, userId: string) {
  return {
    user_id: userId,
    workout_start_time: state.workoutStartTime,
    workout_exercises: state.workoutExercises,
    completed_exercise_ids: state.completedExerciseIds,
    exercise_logs: state.exerciseLogs,
    exercise_pain_levels: state.exercisePainLevels,
    is_custom_workout: state.isCustomWorkout,
    paused_seconds: state.pausedSeconds,
    last_active_at: state.lastActiveAt,
    updated_at: new Date().toISOString(),
  };
}

function fromRow(row: ActiveWorkoutRow): PersistedActiveWorkout {
  const completedIds = Array.isArray(row.completed_exercise_ids)
    ? (row.completed_exercise_ids as unknown[])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id))
    : [];
  const exercises = Array.isArray(row.workout_exercises)
    ? (row.workout_exercises as Exercise[])
    : [];
  return {
    workoutStartTime: Number(row.workout_start_time),
    workoutExercises: exercises,
    completedExerciseIds: completedIds,
    exerciseLogs:
      (row.exercise_logs as Record<number, ExerciseSetRow[]> | null) ?? {},
    exercisePainLevels:
      (row.exercise_pain_levels as Record<number, number> | null) ?? {},
    isCustomWorkout: Boolean(row.is_custom_workout),
    pausedSeconds: row.paused_seconds ?? 0,
    lastActiveAt: Number(row.last_active_at),
    // Bridge remote `updated_at` to local `savedAt` so reconcile compares
    // apples to apples (both epoch ms).
    savedAt: new Date(row.updated_at).getTime(),
  };
}

async function pushToSupabase(state: PersistedActiveWorkout): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  const { error } = await supabase
    .from(TABLE)
    .upsert(toRow(state, userId), { onConflict: "user_id" });
  if (error) {
    throw new Error(
      `Failed to save active workout to Supabase: ${error.message}`
    );
  }
}

function enqueueActualUpsert(state: PersistedActiveWorkout): void {
  upsertQueue = upsertQueue
    .then(() => pushToSupabase(state))
    .then(() => {
      hasUnsyncedLocalChanges = false;
    })
    .catch((err) => {
      // Reset the flag so future fetchRemote() calls aren't blocked forever.
      // The reconcile path compares by savedAt: if local is still ahead, it
      // will re-push automatically, so we don't need this flag as a guard.
      hasUnsyncedLocalChanges = false;
      console.error("Active workout sync to Supabase failed:", err);
    });
}

/**
 * Schedule a debounced upsert of the current local state. Successive calls
 * reset the timer; the most recent state wins.
 */
export function upsertRemote(state: PersistedActiveWorkout): void {
  pendingState = state;
  hasUnsyncedLocalChanges = true;
  if (debounceTimer !== null) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const toSend = pendingState;
    debounceTimer = null;
    pendingState = null;
    if (toSend) enqueueActualUpsert(toSend);
  }, DEBOUNCE_MS);
}

/**
 * Send any pending debounced upsert immediately (e.g. on visibilitychange→hidden,
 * before the tab may be closed). Awaitable so callers can ensure the row
 * reaches Supabase before tearing down.
 */
export function flushPendingUpsert(): Promise<void> {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  const toSend = pendingState;
  pendingState = null;
  if (toSend) enqueueActualUpsert(toSend);
  return upsertQueue;
}

export type FetchRemoteResult =
  | { kind: "ok"; remote: PersistedActiveWorkout | null }
  | { kind: "skip" }
  | { kind: "error" };

/**
 * Read the remote in-progress workout (one row per user) for reconciliation.
 * Returns `skip` while there are still unsynced local changes — otherwise a
 * stale read could clobber recent local progress.
 */
export async function fetchRemote(): Promise<FetchRemoteResult> {
  await upsertQueue;
  if (hasUnsyncedLocalChanges) return { kind: "skip" };

  const userId = await getUserId();
  if (!userId) return { kind: "ok", remote: null };

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch active workout from Supabase:", error);
    return { kind: "error" };
  }

  return {
    kind: "ok",
    remote: data ? fromRow(data as ActiveWorkoutRow) : null,
  };
}

/**
 * Drop the remote row (on finish / discard). Cancels any pending debounced
 * upsert so we don't immediately re-create what we just deleted.
 */
export function deleteRemote(): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  pendingState = null;
  hasUnsyncedLocalChanges = true;
  upsertQueue = upsertQueue
    .then(async () => {
      const userId = await getUserId();
      if (!userId) return;
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("user_id", userId);
      if (error) {
        throw new Error(
          `Failed to delete active workout from Supabase: ${error.message}`
        );
      }
    })
    .then(() => {
      hasUnsyncedLocalChanges = false;
    })
    .catch((err) => {
      hasUnsyncedLocalChanges = false;
      console.error("Active workout delete on Supabase failed:", err);
    });
}

/**
 * Symmetry with the other Supabase services: drop any in-flight debounce /
 * pending state on logout so the next user starts with a clean slate. The
 * localStorage layer is cleared separately via `clearActiveWorkout()`.
 */
export function resetLocalCache(): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  pendingState = null;
  hasUnsyncedLocalChanges = false;
}
