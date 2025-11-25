import type { RefObject } from "react";
import type { Exercise } from "./exercise";

export type SetField = "reps" | "weight";

export interface ExerciseSetRow {
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
  onActivate: (index: number) => void;
  onValueChange: (index: number, field: SetField, value: string) => void;
}

export interface ExerciseSetsPageProps {
  exercise: Exercise;
  onNavigateBack: () => void;
  onStartWorkoutSession: () => void;
  onMarkExerciseComplete?: (exerciseId: number) => void;
  isDuringActiveWorkout?: boolean;
}

export interface WorkoutPageProps {
  onNavigateToHome: () => void;
  onNavigateToWorkout: () => void;
  onNavigateToProfile: () => void;
  activePage: "workout" | "profile";
  onOpenExerciseDetails: (exercise: Exercise) => void;
  onOpenExerciseSets: (exercise: Exercise) => void;
  onStartWorkoutSession: () => void;
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

export interface ActiveWorkoutPageProps {
  onNavigateBack: () => void;
  onOpenExerciseSets: (exercise: Exercise) => void;
  onFinishWorkout: () => void;
  completedExerciseIds?: number[];
  workoutStartTime?: number;
}
