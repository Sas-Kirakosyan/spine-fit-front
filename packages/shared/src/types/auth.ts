export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegistrationFormData {
  email: string;
  password: string;
  username?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginProps {
  onNavigateToHome?: () => void;
  onNavigateToWorkout?: () => void;
}

export interface RegistrationProps {
  onSwitchToLogin?: () => void;
  onNavigateToHome?: () => void;
  onNavigateToWorkout?: () => void;
}
