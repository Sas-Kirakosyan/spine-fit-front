export interface HomePageProps {
  onNavigateToLogin: () => void;
  onNavigateToWorkout: () => void;
}

export interface ProfilePageProps {
  onNavigateToHome: () => void;
  onNavigateToWorkout: () => void;
  onNavigateToProfile: () => void;
  activePage: "workout" | "profile";
}

