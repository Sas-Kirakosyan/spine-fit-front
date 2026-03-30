export interface PromptExercise {
  id: number;
  name: string;
  muscle_groups: string[];
  equipment: string;
  difficulty: string;
  is_back_friendly: boolean;
  restrictions: { issue_type: string; restriction_level: string }[];
}

interface RawExercise {
  id: number;
  name: string;
  muscle_groups: string[];
  equipment: string;
  difficulty: string;
  is_back_friendly: boolean;
  back_issue_restrictions: { issue_type: string; restriction_level: string; [key: string]: unknown }[];
  [key: string]: unknown;
}

export interface QuizContext {
  experience?: string;     // "Beginner" | "Intermediate" | "Advanced"
  painTriggers?: string[]; // e.g. ["Weighted Squats or Deadlifts"]
}

// Difficulty levels that are too advanced for a given experience level
const EXCLUDED_DIFFICULTIES: Record<string, string[]> = {
  Beginner: ["advanced"],
  Intermediate: ["advanced"],
  Advanced: [],
};

// Pain trigger keywords that map to high-restriction filtering
const HIGH_LOAD_TRIGGERS = [
  "Weighted Squats or Deadlifts",
  "Lifting objects from the floor",
];

export function prepareExercisesForPrompt(
  exercises: RawExercise[],
  painStatus?: string,
  context?: QuizContext,
): PromptExercise[] {
  const excludedDifficulties = context?.experience
    ? (EXCLUDED_DIFFICULTIES[context.experience] ?? [])
    : [];

  const filterHighLoad = context?.painTriggers?.some((t) =>
    HIGH_LOAD_TRIGGERS.some((kw) => t.includes(kw)),
  ) ?? false;

  return exercises
    .filter((ex) => {
      // Active symptoms: only back-friendly, and only low restriction level
      if (painStatus === "Active Symptoms" && !ex.is_back_friendly) return false;
      if (
        painStatus === "Active Symptoms" &&
        ex.back_issue_restrictions.some((r) => r.restriction_level === "medium" || r.restriction_level === "high")
      ) return false;
      // Experience-based difficulty filter
      if (excludedDifficulties.includes(ex.difficulty)) return false;
      // Pain trigger: drop exercises with any "high" restriction
      if (filterHighLoad && ex.back_issue_restrictions.some((r) => r.restriction_level === "high")) return false;
      return true;
    })
    .map((ex) => ({
      id: ex.id,
      name: ex.name,
      muscle_groups: ex.muscle_groups,
      equipment: ex.equipment,
      difficulty: ex.difficulty,
      is_back_friendly: ex.is_back_friendly,
      restrictions: ex.back_issue_restrictions.map((r) => ({
        issue_type: r.issue_type,
        restriction_level: r.restriction_level,
      })),
    }));
}
