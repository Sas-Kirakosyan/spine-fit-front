
import type { Exercise } from "@/types/exercise";
import type { ExerciseSetRow } from "@/types/workout";

export function calculateExerciseVolume(
  exercise: Exercise,
  logs: ExerciseSetRow[] = []
): number {
  if (!logs.length) {
    return exercise.weight * exercise.reps * exercise.sets;
  }

  return logs.reduce((sum, setEntry) => {
    if (!setEntry.completed) {
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

