import type { Exercise } from "./exercise";

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
  settings: {
    goal: string;
    workoutsPerWeek: string;
    duration: string;
    durationRange?: string;
    experience: string;
    trainingSplit: string;
    exerciseVariability: string;
    units: string;
    cardio: string;
    stretching: string;
    gender?: string;
    height?: string;
    heightUnit?: string;
    weight?: string;
    weightUnit?: string;
    dateOfBirth?: string;
    bodyType?: string;
    painStatus?: string;
    painLocation?: string[];
    painLevel?: number;
    painTriggers?: string[];
    canSquat?: string;
    additionalNotes?: string;
  };
  workoutDays: WorkoutDay[];
  missingMuscleGroups: string[];
  alternativeExercises: unknown[];
}
