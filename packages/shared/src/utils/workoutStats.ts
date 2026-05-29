
import type { Exercise } from "../types/exercise";
import type { ExerciseSetRow } from "../types/workout";

export function calculateExerciseVolume(
  exercise: Exercise,
  logs: ExerciseSetRow[] = []
): number {
  if (!logs.length) {
    return exercise.weight * exercise.reps * exercise.sets;
  }

  return logs.reduce((sum, setEntry) => {
    if (!setEntry.completed || setEntry.type === "warmup") {
      return sum;
    }
    const reps = Number(setEntry.reps);
    const weight = Number(setEntry.weight);
    if (Number.isNaN(reps) || Number.isNaN(weight)) {
      return sum;
    }
    return sum + reps * weight;
  }, 0);
}

export function calculateWorkoutVolume(
  exercises: Exercise[],
  completedExerciseLogs: Record<number, ExerciseSetRow[]>
): number {
  return exercises.reduce((total, exercise) => {
    const logs = completedExerciseLogs[exercise.id] ?? [];
    return total + calculateExerciseVolume(exercise, logs);
  }, 0);
}

// Total reps summed across *all* logged sets (warmup included). For time-based
// exercises this doubles as the total duration in seconds, since `reps` holds
// the seconds value there.
export function calculateExerciseTotalReps(logs: ExerciseSetRow[] = []): number {
  return logs.reduce((sum, setEntry) => {
    const reps = Number(setEntry.reps);
    return Number.isNaN(reps) ? sum : sum + reps;
  }, 0);
}

// Heaviest weight lifted across *all* logged sets (warmup included). Returns 0
// when nothing valid was logged (e.g. bodyweight exercises).
export function getExerciseMaxWeight(logs: ExerciseSetRow[] = []): number {
  return logs.reduce((max, setEntry) => {
    const weight = Number(setEntry.weight);
    return Number.isNaN(weight) ? max : Math.max(max, weight);
  }, 0);
}

