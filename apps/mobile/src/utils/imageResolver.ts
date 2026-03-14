import { getExerciseImageUrl } from "@spinefit/shared";

export function getExerciseImageSource(exercise: { name: string }): { uri: string } {
  const url = getExerciseImageUrl(exercise.name);
  return { uri: url };
}
