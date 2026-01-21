import type { RefObject } from "react";
import type { Exercise } from "./exercise";

export type SetField = "reps" | "weight";

export interface ExerciseSetRow {
  id: string;
  reps: string;
  weight: string;
  completed: boolean;
}

export interface ExerciseSetProps {
  index: number;
  setEntry: ExerciseSetRow;
  exercise: Exercise;
  isActive: boolean;
  isCompleted: boolean;
  canDelete: boolean;
  onActivate: (index: number) => void;
  onValueChange: (index: number, field: SetField, value: string) => void;
  onDelete: (index: number) => void;
}

export interface ExerciseSetsPageProps {
  exercise: Exercise;
  onNavigateBack: () => void;
  onStartWorkoutSession: () => void;
  onMarkExerciseComplete?: (exerciseId: number, sets: ExerciseSetRow[]) => void;
  isDuringActiveWorkout?: boolean;
  exerciseLogs?: Record<number, ExerciseSetRow[]>;
}

export interface WorkoutPageProps {
  onNavigateToHome: () => void;
  onNavigateToWorkout: () => void;
  onNavigateToProfile: () => void;
  onNavigateToHistory: () => void;
  onNavigateToAI?: () => void;
  activePage: "workout" | "profile" | "history" | "ai";
  onOpenExerciseDetails: (exercise: Exercise) => void;
  onOpenExerciseSets: (exercise: Exercise) => void;
  onStartWorkoutSession: () => void;
  onNavigateToAllExercise?: () => void;
  onNavigateToMyPlan?: () => void;
  exercises?: Exercise[];
  onRemoveExercise?: (exerciseId: number) => void;
  completedWorkoutIds?: Set<string>;
}

export interface ExerciseDetailsProps {
  exercise: Exercise;
  onNavigateBack: () => void;
  onStartWorkout: (exercise: Exercise) => void;
}

export interface ExerciseActionSheetProps {
  exercise: Exercise;
  onClose: () => void;
  onShowDetails: () => void;
  onStartWorkout?: () => void;
  onReplace?: () => void;
  onDelete?: () => void;
  containerRef: RefObject<HTMLDivElement | null>;
}

export interface FinishedWorkoutSummary {
  id: string;
  finishedAt: string;
  duration: string;
  totalVolume: number;
  exerciseCount: number;
  caloriesBurned: number;
  completedExercises: Exercise[];
  completedExerciseLogs: Record<number, ExerciseSetRow[]>;
}

export interface ActiveWorkoutPageProps {
  onNavigateBack: () => void;
  onOpenExerciseSets: (exercise: Exercise) => void;
  onFinishWorkout: (summary?: FinishedWorkoutSummary) => void;
  completedExerciseIds?: number[];
  workoutStartTime?: number;
  exerciseLogs?: Record<number, ExerciseSetRow[]>;
  completedWorkoutIds?: Set<string>;
  setCompletedWorkoutIds?: (ids: Set<string>) => void;
}
