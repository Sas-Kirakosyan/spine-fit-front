import type { Exercise } from "../types/exercise";
import allExercisesData from "../MockData/allExercise.json";

const baseExercisesById = new Map<number, Exercise>(
  (allExercisesData as Exercise[]).map((e) => [e.id, e]),
);

export function getBaseExerciseById(id: number): Exercise | undefined {
  return baseExercisesById.get(id);
}

export function getAllBaseExercises(): Exercise[] {
  return allExercisesData as Exercise[];
}

export function isTimeBasedExercise(exercise: Pick<Exercise, "id" | "weight_unit">): boolean {
  if (exercise.weight_unit === "time") return true;
  const base = baseExercisesById.get(exercise.id);
  return base?.weight_unit === "time";
}

export function getExerciseTimeSeconds(exercise: Pick<Exercise, "id" | "reps">): number {
  const base = baseExercisesById.get(exercise.id);
  const value = base?.reps ?? exercise.reps;
  return Number(value) || 0;
}

export function formatDurationSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  if (mins > 0 && secs > 0) return `${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m`;
  return `${secs}s`;
}

function nameToKebab(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/\//g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getExerciseImageUrl(
  exercise: Partial<Pick<Exercise, "media" | "name">>,
): string {
  if (exercise.media && exercise.media.length > 0) {
    const primary = exercise.media.find((m) => m.primary);
    return primary?.url ?? exercise.media[0]?.url ?? "";
  }
  if (exercise.name) {
    return `/exercisesSm/${nameToKebab(exercise.name)}.webp`;
  }
  return "";
}
