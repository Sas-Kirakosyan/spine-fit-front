export interface ExerciseRestriction {
  id: number;
  exercise_id: number;
  issue_type: string;
  restriction_level: string;
  recommendation: string;
  created_at: string;
  updated_at: string;
}

export interface ExerciseMedia {
  type: string;
  source: string;
  url: string;
  primary?: boolean;
}

export interface Exercise {
  id: number;
  name: string;
  description: string;
  category: string;
  muscle_groups: string[];
  equipment: string;
  difficulty: string;
  instructions: string;
  video_url: string;
  media: ExerciseMedia[];
  is_back_friendly: boolean;
  back_issue_restrictions: ExerciseRestriction[];
  created_at: string;
  updated_at: string;
  sets: number;
  reps: number;
  weight: number;
  weight_unit: string;
  load_mode?: "external" | "assistance";
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
    return `/exercises/${nameToKebab(exercise.name)}.png`;
  }
  return "";
}

