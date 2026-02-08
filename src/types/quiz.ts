export interface QuizQuestion {
  id: number;
  fieldName?: string;
  question?: string;
  type: "radio" | "checkbox" | "input" | "info" | "slider" | "image_radio" | "multi_field";
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
  fields?: {
    id: number;
    fieldName: string;
    label: string;
    type: "radio" | "input" | "date";
    options?: string[];
    inputType?: "number" | "text";
    placeholder?: string;
    optional?: boolean;
    unitOptions?: string[];
  }[];
}

export interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuizComplete?: () => void;
}

export interface QuizAnswers {
  workoutType: "home" | "gym";
  answers: Record<number, number | number[] | string | Record<string, string | number>>;
  units?: Record<number, string | Record<string, string>>;
  timestamp?: string;
}
