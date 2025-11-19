export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegistrationFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface LoginProps {
  onSwitchToRegister?: () => void;
  onNavigateToHome?: () => void;
  onNavigateToWorkout?: () => void;
}

export interface RegistrationProps {
  onSwitchToLogin?: () => void;
  onNavigateToHome?: () => void;
  onNavigateToWorkout?: () => void;
}
