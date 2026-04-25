import { getExerciseImageUrl as getExerciseImageUrlShared } from "@spinefit/shared";
import { assetUrl } from "@/lib/assets";
import type { Exercise } from "@/types/exercise";

// exercisesSm must precede exercises — the shorter pattern would match both.
const LEGACY_PREFIXES: Array<[RegExp, string]> = [
  [/^\/?exercisesSm\//, "Photo/Exercises/"],
  [/^\/?exercises\//, "Photo/Exercises/"],
  [/^\/?quiz\//, "Photo/Quiz/"],
  [/^\/?logo\//, "Photo/Logo/"],
];

const normalizeAssetPath = (path: string): string => {
  if (!path) return path;
  if (/^https?:\/\//.test(path)) return path;
  for (const [pattern, replacement] of LEGACY_PREFIXES) {
    if (pattern.test(path)) return path.replace(pattern, replacement);
  }
  return path;
};

export function getExerciseImageUrl(
  exercise: Partial<Pick<Exercise, "media" | "name">>
): string {
  return assetUrl(normalizeAssetPath(getExerciseImageUrlShared(exercise)));
}
