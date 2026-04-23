import type { FinishedWorkoutSummary } from "./workout";

export interface HomePageProps {
  onNavigateToLogin: () => void;
  onNavigateToWorkout: () => void;
  onNavigateToGeneratingPlan: () => void;
}

export interface ProgressPageProps {
  onNavigateToHome: () => void;
  onNavigateToWorkout: () => void;
  onNavigateToProgress: () => void;
  onNavigateToHistory: () => void;
  onNavigateToProfile: () => void;
  onNavigateToAI: () => void;
  onExerciseClick?: (exerciseId: number) => void;
  activePage: "workout" | "progress" | "history" | "profile" | "ai";
  workoutHistory: FinishedWorkoutSummary[];
}

export interface HistoryPageProps {
  onNavigateToWorkout: () => void;
  onNavigateToProgress: () => void;
  onNavigateToHistory: () => void;
  onNavigateToProfile: () => void;
  onNavigateToAI?: () => void;
  activePage: "workout" | "progress" | "history" | "profile" | "ai";
  workouts: FinishedWorkoutSummary[];
}

export interface MyPlanPageProps {
  onNavigateBack: () => void;
  onNavigateToAvailableEquipment?: () => void;
}

export interface AvailableEquipmentPageProps {
  onNavigateBack: () => void;
}

export interface AIPageProps {
  onNavigateToWorkout: () => void;
  onNavigateToProgress: () => void;
  onNavigateToHistory: () => void;
  onNavigateToProfile: () => void;
  onNavigateToAI: () => void;
  activePage: "workout" | "progress" | "history" | "profile" | "ai";
}

export interface IProfilePageProps {
    onNavigateToWorkout: () => void;
    onNavigateToProgress: () => void;
    onNavigateToHistory: () => void;
    onNavigateToProfile: () => void;
    onNavigateToAI: () => void;
    onNavigateToSettings: () => void;
    activePage: "workout" | "progress" | "history" | "profile" | "ai";
}

export interface SettingsPageProps {
  onNavigateBack: () => void;
}

export interface ExerciseProgressPageProps {
  exerciseId: number;
  onNavigateBack: () => void;
  workoutHistory: FinishedWorkoutSummary[];
}
