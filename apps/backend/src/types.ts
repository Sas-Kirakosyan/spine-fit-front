export interface ParsedQuizData {
  goal: string;
  workoutsPerWeek: string;
  duration: string;
  durationRange: string;
  experience: string;
  trainingSplit: string;
  exerciseVariability: string;
  units: string;
  cardio: string;
  stretching: string;
  gender?: string;
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
}
