export interface QuizQuestion {
  id: number;
  question?: string;
  type: "radio" | "checkbox" | "input" | "info" | "slider";
  title?: string;
  description?: string;
  buttonText?: string;
  options?: string[];
  correctAnswer?: number | number[] | string | number;
  inputType?: "number" | "text";
  placeholder?: string;
  optional?: boolean;
  min?: number;
  max?: number;

  showIf?: {
    questionId: number;
    equals: string | number;
  };
}

export interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutType: "home" | "gym";
  onQuizComplete?: () => void;
}

