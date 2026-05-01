import type { Exercise } from "./exercise";
import type { PlanSettings } from "./planSettings";

export interface WorkoutDay {
  dayNumber: number;
  dayName: string;
  muscleGroups: string[];
  exercises: Exercise[];
}

export interface GeneratedPlan {
  id: string;
  name: string;
  splitType: string;
  weeks: number;
  createdAt: string;
  settings: PlanSettings;
  workoutDays: WorkoutDay[];
  missingMuscleGroups: string[];
  alternativeExercises: unknown[];
}
