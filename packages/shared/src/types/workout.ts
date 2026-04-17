import type { RefObject } from "react";
import type { Exercise } from "./exercise";

export type SetField = "reps" | "weight";
export type SetType = "working" | "warmup";

export interface ExerciseSetRow {
  id: string;
  reps: string;
  weight: string;
  completed: boolean;
  type?: SetType;
}

export type ExerciseTimerStatus = "idle" | "running" | "paused";

export interface ExerciseSetProps {
  index: number;
  setEntry: ExerciseSetRow;
  exercise: Exercise;
  previousValue: string;
  isActive: boolean;
  isCompleted: boolean;
  canDelete: boolean;
  canLogSet: boolean;
  onActivate: (index: number) => void;
  onValueChange: (index: number, field: SetField, value: string) => void;
  onLogSet: (index: number) => void;
  onDelete: (index: number) => void;
  displayLabel?: string;
  isTimeBased?: boolean;
  timerStatus?: ExerciseTimerStatus;
  timerElapsedSeconds?: number;
  onStartTimer?: (index: number) => void;
  onPauseTimer?: () => void;
  onResumeTimer?: () => void;
  onConfirmTimer?: (index: number) => void;
  onOpenTimeModal?: (index: number) => void;
}

export interface ExerciseSetsPageProps {
  exercise: Exercise;
  onNavigateBack: () => void;
  onStartWorkoutSession: () => void;
  onNavigateToHistory?: () => void;
  onMarkExerciseComplete?: (exerciseId: number, sets: ExerciseSetRow[], painLevel: number | undefined) => void;
  onSkipExercise?: (exerciseId: number) => void;
  isDuringActiveWorkout?: boolean;
  exerciseLogs?: Record<number, ExerciseSetRow[]>;
  workoutHistory?: FinishedWorkoutSummary[];
}

export interface WorkoutPageProps {
  onNavigateToHome: () => void;
  onNavigateToWorkout: () => void;
  onNavigateToProgress: () => void;
  onNavigateToHistory: () => void;
  onNavigateToAI?: () => void;
  activePage: "workout" | "progress" | "history" | "ai";
  onOpenExerciseDetails: (exercise: Exercise) => void;
  onOpenExerciseSets: (exercise: Exercise) => void;
  onStartWorkoutSession: () => void;
  onNavigateToAllExercise?: () => void;
  onNavigateToMyPlan?: () => void;
  onCreateProgramFromScratch?: () => void;
  onSelectSavedProgram?: (program: SavedProgram) => void;
  onEditSavedProgram?: (program: SavedProgram) => void;
  exercises?: Exercise[];
  isCustomWorkout?: boolean;
  onRemoveExercise?: (exerciseId: number) => void;
  completedWorkoutIds?: Set<string>;
}

export interface SavedWorkout {
  id: string;
  name: string;
  exercises: Exercise[];
  createdAt: string;
}

export interface TrainingDay {
  id: string;
  name: string;
  exercises: Exercise[];
}

export interface SavedProgram {
  id: string;
  name: string;
  days: TrainingDay[];
  createdAt: string;
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
  averagePainLevel?: number;
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
  exercisePainLevels?: Record<number, number>;
  customExercises?: Exercise[];
  isCustomWorkout?: boolean;
}
