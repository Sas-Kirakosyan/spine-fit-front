import type { FinishedWorkoutSummary } from "@spinefit/shared";
import { supabase } from "@/lib/supabase";

const CACHE_KEY = "workoutHistoryCache";
const PENDING_KEY = "pendingWorkoutHistorySync";
const DUPLICATE_KEY_VIOLATION = "23505";

let cachedHistory: FinishedWorkoutSummary[] = loadFromLocalStorage(CACHE_KEY);

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function loadFromLocalStorage(key: string): FinishedWorkoutSummary[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FinishedWorkoutSummary[]) : [];
  } catch {
    return [];
  }
}

function writeCacheToLocalStorage(): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cachedHistory));
  } catch {
    // localStorage is best-effort; if it's full, the in-memory cache and
    // Supabase remain authoritative.
  }
}

function readPending(): FinishedWorkoutSummary[] {
  return loadFromLocalStorage(PENDING_KEY);
}

function writePending(pending: FinishedWorkoutSummary[]): void {
  try {
    if (pending.length === 0) {
      localStorage.removeItem(PENDING_KEY);
    } else {
      localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    }
  } catch {
    // ignore quota errors
  }
}

function appendPending(summary: FinishedWorkoutSummary): void {
  const pending = readPending();
  if (pending.some((entry) => entry.id === summary.id)) return;
  pending.push(summary);
  writePending(pending);
}

function removePending(id: string): void {
  const pending = readPending();
  const next = pending.filter((entry) => entry.id !== id);
  if (next.length !== pending.length) writePending(next);
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

interface WorkoutHistoryRow {
  id: string;
  user_id: string;
  finished_at: string;
  duration: string;
  total_volume: number | string;
  exercise_count: number;
  calories_burned: number | string;
  completed_exercises: FinishedWorkoutSummary["completedExercises"];
  completed_exercise_logs: FinishedWorkoutSummary["completedExerciseLogs"];
  average_pain_level: number | string | null;
}

function toRow(summary: FinishedWorkoutSummary, userId: string) {
  return {
    id: summary.id,
    user_id: userId,
    finished_at: summary.finishedAt,
    duration: summary.duration,
    total_volume: summary.totalVolume,
    exercise_count: summary.exerciseCount,
    calories_burned: summary.caloriesBurned,
    completed_exercises: summary.completedExercises,
    completed_exercise_logs: summary.completedExerciseLogs,
    average_pain_level: summary.averagePainLevel ?? null,
  };
}

function fromRow(row: WorkoutHistoryRow): FinishedWorkoutSummary {
  return {
    id: row.id,
    finishedAt: row.finished_at,
    duration: row.duration,
    totalVolume: Number(row.total_volume),
    exerciseCount: row.exercise_count,
    caloriesBurned: Number(row.calories_burned),
    completedExercises: row.completed_exercises,
    completedExerciseLogs: row.completed_exercise_logs,
    averagePainLevel:
      row.average_pain_level === null ? undefined : Number(row.average_pain_level),
  };
}

async function insertSummary(
  summary: FinishedWorkoutSummary,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("workout_history")
    .insert(toRow(summary, userId));
  if (error && error.code !== DUPLICATE_KEY_VIOLATION) {
    throw new Error(`Failed to save workout to Supabase: ${error.message}`);
  }
}

// Serialize writes so retries don't race with newly enqueued inserts.
let insertQueue: Promise<void> = Promise.resolve();

function enqueueInsert(summary: FinishedWorkoutSummary): void {
  insertQueue = insertQueue
    .then(async () => {
      const userId = await getUserId();
      if (!userId) return;
      await insertSummary(summary, userId);
      removePending(summary.id);
    })
    .catch((err) => {
      console.error("Workout history sync failed:", err);
    });
}

async function retryPending(): Promise<void> {
  const pending = readPending();
  if (pending.length === 0) return;
  const userId = await getUserId();
  if (!userId) return;
  for (const summary of pending) {
    try {
      await insertSummary(summary, userId);
      removePending(summary.id);
    } catch (err) {
      console.error("Workout history retry failed:", err);
      // Stop on first failure — likely network down. Remaining entries stay
      // pending and will be retried on the next fetch / focus / login.
      return;
    }
  }
}

export function getHistory(): FinishedWorkoutSummary[] {
  return cachedHistory;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function addWorkout(summary: FinishedWorkoutSummary): void {
  cachedHistory = [...cachedHistory, summary];
  writeCacheToLocalStorage();
  appendPending(summary);
  notify();
  enqueueInsert(summary);
}

export async function fetchHistory(): Promise<void> {
  await insertQueue;
  await retryPending();

  const userId = await getUserId();
  if (!userId) {
    cachedHistory = [];
    writeCacheToLocalStorage();
    notify();
    return;
  }

  const { data, error } = await supabase
    .from("workout_history")
    .select("*")
    .eq("user_id", userId)
    .order("finished_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch workout history from Supabase:", error);
    return;
  }

  const remote = (data ?? []).map((row) => fromRow(row as WorkoutHistoryRow));

  // Merge any still-pending local entries (those that haven't reached Supabase
  // yet) so they remain visible even when retries fail.
  const pending = readPending();
  const remoteIds = new Set(remote.map((entry) => entry.id));
  const stillPending = pending.filter((entry) => !remoteIds.has(entry.id));

  cachedHistory = [...remote, ...stillPending];
  writeCacheToLocalStorage();
  notify();
}

export function resetLocalCache(): void {
  cachedHistory = [];
  notify();
}
