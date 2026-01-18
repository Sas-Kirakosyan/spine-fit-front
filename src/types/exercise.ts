export interface ExerciseRestriction {
  id: number;
  exercise_id: number;
  issue_type: string;
  restriction_level: string;
  recommendation: string;
  created_at: string;
  updated_at: string;
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
  image_url: string;
  equipment_image_url?: string;
  is_back_friendly: boolean;
  back_issue_restrictions: ExerciseRestriction[];
  created_at: string;
  updated_at: string;
  sets: number;
  reps: number;
  weight: number;
  weight_unit: string;
  load_mode?: "external" | "assistance"; // external = add weight makes harder, assistance = add weight makes easier
}

