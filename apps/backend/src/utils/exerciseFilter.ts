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

export function prepareExercisesForPrompt(
  exercises: RawExercise[],
  painStatus?: string,
): PromptExercise[] {
  return exercises
    .filter((ex) => painStatus !== "Active Symptoms" || ex.is_back_friendly)
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
