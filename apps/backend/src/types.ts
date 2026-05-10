export interface ParsedQuizData {
  goal: string;
  originalGoal?: string;
  workoutsPerWeek: string;
  duration: string;
  experience: string;
  trainingSplit: string;
  exerciseVariability: string;
  units: string;
  cardio: string;
  stretching: string;
  gender?: string;
  birthYear?: number;
  height?: string;
  heightUnit: string;
  weight?: string;
  weightUnit: string;
  dateOfBirth?: string;
  bodyType?: string;
  painStatus?: string;
  painLocation?: string[];
  painLevel?: number;
  painTriggers?: string[];
  canSquat?: string;
  additionalNotes?: string;
}
