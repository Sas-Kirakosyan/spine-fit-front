import type { Exercise } from "../types/exercise";

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
