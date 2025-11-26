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
  activePage: "workout" | "profile" | "history";
}

export interface HistoryPageProps {
  onNavigateToWorkout: () => void;
  onNavigateToProfile: () => void;
  onNavigateToHistory: () => void;
  activePage: "workout" | "profile" | "history";
  workouts: FinishedWorkoutSummary[];
}

