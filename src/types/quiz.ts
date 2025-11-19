export interface QuizQuestion {
  id: number;
  question: string;
  type: "radio" | "checkbox" | "input";
  options?: string[];
  correctAnswer?: number | number[] | string | number;
  inputType?: "number" | "text";
  placeholder?: string;
  optional?: boolean;
}

export interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutType: "home" | "gym";
  onQuizComplete?: () => void;
}

