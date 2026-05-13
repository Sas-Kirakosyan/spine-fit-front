import type { TFunction } from "i18next";

const keyMap: Record<string, string> = {
  Chest: "muscleGroups.chest",
  Back: "muscleGroups.back",
  Shoulders: "muscleGroups.shoulders",
  Arms: "muscleGroups.arms",
  Core: "muscleGroups.core",
  Legs: "muscleGroups.legs",
  Rehab: "muscleGroups.rehab",
  Other: "muscleGroups.other",
};

export function getMuscleGroupLabel(t: TFunction, category: string): string {
  const key = keyMap[category];
  if (!key) return category;
  return t(key, category);
}
