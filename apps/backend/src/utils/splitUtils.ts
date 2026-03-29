export const SPLIT_TARGET_MUSCLES: Record<string, string[]> = {
  FULL_BODY_ABC: ["chest", "lats", "upper_back", "quadriceps", "glutes", "hamstrings"],
  FULL_BODY_AB: ["chest", "lats", "upper_back", "quadriceps", "glutes", "hamstrings"],
  FULL_BODY_4X: ["chest", "lats", "upper_back", "quadriceps", "glutes", "hamstrings"],
  UPPER_LOWER_UPPER: ["chest", "lats", "upper_back", "front_delts", "rear_delts", "triceps", "biceps", "quadriceps", "glutes", "hamstrings"],
  UPPER_LOWER_4X: ["chest", "lats", "upper_back", "front_delts", "rear_delts", "triceps", "biceps", "quadriceps", "glutes", "hamstrings"],
  PUSH_PULL_LEGS: ["chest", "front_delts", "triceps", "lats", "upper_back", "rear_delts", "biceps", "quadriceps", "glutes", "hamstrings"],
  BRO_SPLIT: ["chest", "lats", "upper_back", "front_delts", "rear_delts", "triceps", "biceps", "quadriceps", "glutes", "hamstrings"],
};

export function mapSplitType(split: string): string {
  if (/Full Body.*A.*B.*C/i.test(split)) return "FULL_BODY_ABC";
  if (/Full Body.*A.*B/i.test(split)) return "FULL_BODY_AB";
  if (/Full Body/i.test(split)) return "FULL_BODY_4X";
  if (/Upper.*Lower.*Upper/i.test(split)) return "UPPER_LOWER_UPPER";
  if (/Upper.*Lower/i.test(split)) return "UPPER_LOWER_4X";
  if (/Push.*Pull.*Legs/i.test(split)) return "PUSH_PULL_LEGS";
  if (/Bro Split/i.test(split)) return "BRO_SPLIT";
  return "FULL_BODY_ABC";
}
