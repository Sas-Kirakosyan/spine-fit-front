import { getExerciseImageUrl } from "@spinefit/shared";
import { getLocalImageSource } from "./imageRegistry";

export function getExerciseImageSource(
  exercise: Partial<Parameters<typeof getExerciseImageUrl>[0]>,
): number | { uri: string } {
  const url = getExerciseImageUrl(exercise);
  const local = getLocalImageSource(url);
  if (local !== null) return local;
  // Fallback to URI (e.g. for remote media URLs)
  return { uri: url };
}
