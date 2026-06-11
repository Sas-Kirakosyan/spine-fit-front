import type { ExerciseSetRow, SetType } from "@/types/workout";

const KEY = "plannedExerciseSets";

/** A user-edited default set row; ids and completion are session-local. */
export interface PlannedSetRow {
  reps: string;
  weight: string;
  type?: SetType;
}

interface PlannedSetsFile {
  /** Plan the overrides belong to; null for custom workouts without a plan. */
  planId: string | null;
  sets: Record<number, PlannedSetRow[]>;
}

function loadFile(planId: string | null): PlannedSetsFile | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PlannedSetsFile;
    // planId mismatch → these overrides belong to another plan/context. Return
    // null without deleting: the next save under the active planId overwrites
    // the file wholesale, so wiping here would only risk clobbering real data
    // when planId is transiently unavailable.
    if (parsed?.planId !== planId || typeof parsed?.sets !== "object") {
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(KEY);
    return null;
  }
}

export function getPlannedSetsForExercise(
  planId: string | null,
  exerciseId: number
): PlannedSetRow[] | undefined {
  const file = loadFile(planId);
  const rows = file?.sets[exerciseId];
  return rows && rows.length > 0 ? rows : undefined;
}

export function savePlannedSetsForExercise(
  planId: string | null,
  exerciseId: number,
  rows: ExerciseSetRow[]
): void {
  const file = loadFile(planId) ?? { planId, sets: {} };
  file.sets[exerciseId] = rows.map(({ reps, weight, type }) =>
    type !== undefined ? { reps, weight, type } : { reps, weight }
  );
  localStorage.setItem(KEY, JSON.stringify(file));
}

/** Carry overrides to a replacement exercise (plan-wide swaps drop the source). */
export function copyPlannedSets(
  planId: string | null,
  fromExerciseId: number,
  toExerciseId: number,
  options?: { removeSource?: boolean }
): void {
  const file = loadFile(planId);
  const rows = file?.sets[fromExerciseId];
  if (!file || !rows || rows.length === 0) return;
  file.sets[toExerciseId] = rows;
  if (options?.removeSource) {
    delete file.sets[fromExerciseId];
  }
  localStorage.setItem(KEY, JSON.stringify(file));
}

export function clearAllPlannedSets(): void {
  localStorage.removeItem(KEY);
}
