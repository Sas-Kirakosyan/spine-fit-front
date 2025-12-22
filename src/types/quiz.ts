export interface QuizQuestion {
  id: number;
  fieldName?: string;
  question?: string;
  type: "radio" | "checkbox" | "input" | "info" | "slider" | "image_radio";
  title?: string;
  description?: string;
  buttonText?: string;
  options?: string[] | { value: string; label: string; image: string; description: string }[];
  optionsFemale?: { value: string; label: string; image: string; description: string }[];
  correctAnswer?: number | number[] | string | number;
  inputType?: "number" | "text";
  placeholder?: string;
  optional?: boolean;
  min?: number;
  max?: number;
  showIf?: {
    fieldName: string;
    equals?: string | number;
    in?: string[];
    showOptionsBasedOn?: boolean;
  };
}

export interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutType: "home" | "gym";
  onQuizComplete?: () => void;
}

export interface QuizAnswers {
  workoutType: "home" | "gym";
  answers: Record<number, number | number[] | string>;
  units?: Record<number, string>;
  timestamp?: string;
}
