import type { FinishedWorkoutSummary } from "./workout";

export interface HomePageProps {
  onNavigateToLogin: () => void;
  onNavigateToWorkout: () => void;
}

export interface ProfilePageProps {
  onNavigateToHome: () => void;
  onNavigateToWorkout: () => void;
  onNavigateToProfile: () => void;
  onNavigateToHistory: () => void;
  onNavigateToSettings: () => void;
  activePage: "workout" | "profile" | "history";
}

export interface HistoryPageProps {
  onNavigateToWorkout: () => void;
  onNavigateToProfile: () => void;
  onNavigateToHistory: () => void;
  onNavigateToAI?: () => void;
  activePage: "workout" | "profile" | "history" | "ai";
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
  onNavigateToProfile: () => void;
  onNavigateToHistory: () => void;
  onNavigateToAI: () => void;
  activePage: "workout" | "profile" | "history" | "ai";
}
export interface SettingsPageProps {
  onNavigateBack: () => void;
}

