import type { Exercise } from "@/types/exercise";
import type { ExerciseSetRow } from "@/types/workout";

const KEY = "activeWorkout";

/** A forgotten session older than this is dropped instead of resurrected. */
export const STALE_MS = 24 * 60 * 60 * 1000;
/** How often the heartbeat timestamp is refreshed while training. */
export const HEARTBEAT_MS = 5_000;

export interface PersistedActiveWorkout {
  workoutStartTime: number; // epoch ms (absolute) — timer reconstructs from this
  workoutExercises: Exercise[]; // the actual list of exercises in this session
  completedExerciseIds: number[];
  exerciseLogs: Record<number, ExerciseSetRow[]>;
  exercisePainLevels: Record<number, number>;
  isCustomWorkout: boolean;
  pausedSeconds: number; // legacy: persisted for back-compat; no longer affects logged duration/calories
  lastActiveAt: number; // heartbeat timestamp (epoch ms)
  savedAt: number;
}

/**
 * Load the in-progress workout. Returns null (and clears storage) when there
 * is no session or it is stale enough to be considered abandoned.
 */
export function loadActiveWorkout(): PersistedActiveWorkout | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PersistedActiveWorkout;
    if (
      typeof parsed?.workoutStartTime !== "number" ||
      typeof parsed?.savedAt !== "number"
    ) {
      clearActiveWorkout();
      return null;
    }
    if (Date.now() - parsed.savedAt > STALE_MS) {
      clearActiveWorkout();
      return null;
    }
    return parsed;
  } catch {
    clearActiveWorkout();
    return null;
  }
}

/**
 * Persist the in-progress workout. `savedAt` defaults to now; pass an explicit
 * value when adopting a remote snapshot so future reconciles compare local and
 * remote timestamps on equal footing. `lastActiveAt` likewise defaults to now
 * (the heartbeat owns it).
 */
export function saveActiveWorkout(
  data: Omit<PersistedActiveWorkout, "savedAt" | "lastActiveAt"> & {
    lastActiveAt?: number;
    savedAt?: number;
  }
): void {
  const now = Date.now();
  const payload: PersistedActiveWorkout = {
    ...data,
    lastActiveAt: data.lastActiveAt ?? now,
    savedAt: data.savedAt ?? now,
  };
  localStorage.setItem(KEY, JSON.stringify(payload));
}

export function clearActiveWorkout(): void {
  localStorage.removeItem(KEY);
}

/**
 * Refresh only the heartbeat timestamp via read-modify-write, so a tick never
 * clobbers session data with stale React state.
 */
export function touchActiveWorkoutHeartbeat(): void {
  const raw = localStorage.getItem(KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as PersistedActiveWorkout;
    parsed.lastActiveAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(parsed));
  } catch {
    /* corrupt entry — leave it for loadActiveWorkout() to clear */
  }
}
