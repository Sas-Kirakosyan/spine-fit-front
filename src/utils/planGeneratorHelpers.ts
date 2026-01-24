import type { QuizAnswers } from "@/types/quiz";
import type { PlanSettings } from "@/types/planSettings";

export interface SourceOnboarding {
  workoutType: "gym" | "home";
  goal: string;
  gender?: string;
  ageRange?: string;
  heightCm?: number;
  weightKg?: number;
  bodyType?: string;
  experience: string;
  trainingFrequency: string;
  painStatus?: string;
  painLocation?: string[];
  painTriggers?: string[];
  canSquat?: string;
  workoutDuration: string;
}

/**
 * Build sourceOnboarding object from quiz answers and plan settings
 * Captures all original user inputs for debugging and AI-readiness
 */
export function buildSourceOnboarding(
  quizAnswers: QuizAnswers | null,
  planSettings: PlanSettings
): SourceOnboarding | undefined {
  if (!quizAnswers) return undefined;

  const answers = quizAnswers.answers;

  // Extract all quiz answers with proper type mapping
  const goalAnswer = answers[2];
  const goalOptions = [
    "Build muscle safely (gym-goer with back or sciatic pain)",
    "Reduce pain and improve back health",
  ];
  const goal = typeof goalAnswer === "number" ? goalOptions[goalAnswer] : planSettings.goal;

  const genderAnswer = answers[3];
  const genderOptions = ["Male", "Female", "Other"];
  const gender = typeof genderAnswer === "number" ? genderOptions[genderAnswer] : undefined;

  const ageRangeAnswer = answers[4];
  const ageRangeOptions = ["18–29", "30–39", "40–49", "50+"];
  const ageRange = typeof ageRangeAnswer === "number" ? ageRangeOptions[ageRangeAnswer] : undefined;

  const heightAnswer = answers[5];
  const heightCm = typeof heightAnswer === "string" ? parseInt(heightAnswer, 10) : undefined;

  const weightAnswer = answers[6];
  const weightKg = typeof weightAnswer === "string" ? parseInt(weightAnswer, 10) : undefined;

  const bodyTypeAnswer = answers[7];
  // bodyType returns an index - map based on gender
  let bodyType: string | undefined;
  if (typeof bodyTypeAnswer === "number") {
    const isFemale = gender === "Female";
    const bodyTypeOptions = isFemale
      ? ["18-24", "25-31", "32-38", "38+"]
      : ["8-15", "16-22", "23-30", "30+"];
    bodyType = bodyTypeOptions[bodyTypeAnswer];
  }

  const experienceAnswer = answers[8];
  const experienceOptions = ["Beginner", "Intermediate", "Advanced"];
  const experience = typeof experienceAnswer === "number"
    ? experienceOptions[experienceAnswer]
    : planSettings.experience;

  const trainingFrequencyAnswer = answers[9];
  const frequencyOptions = ["2", "3", "4", "5+"];
  const trainingFrequency = typeof trainingFrequencyAnswer === "number"
    ? frequencyOptions[trainingFrequencyAnswer]
    : "3";

  const painStatusAnswer = answers[10];
  const painStatusOptions = ["Never", "In the past", "Yes, currently"];
  const painStatus = typeof painStatusAnswer === "number"
    ? painStatusOptions[painStatusAnswer]
    : undefined;

  const painLocationAnswer = answers[11];
  const painLocationOptions = [
    "Lower back (L5–S1)",
    "Middle back",
    "Upper back",
    "Sciatica",
    "Leg",
    "Shoulder",
    "Other",
  ];
  const painLocation = Array.isArray(painLocationAnswer)
    ? painLocationAnswer.map((idx) => painLocationOptions[idx as number])
    : undefined;

  const painTriggersAnswer = answers[13];
  const painTriggersOptions = [
    "walking",
    "Bending forward",
    "Lifting heavy objects",
    "Long sitting",
    "Running or jumping",
    "Deadlifts / squats with weight",
    "Other activities",
  ];
  const painTriggers = Array.isArray(painTriggersAnswer)
    ? painTriggersAnswer.map((idx) => painTriggersOptions[idx as number])
    : undefined;

  const canSquatAnswer = answers[14];
  const canSquatOptions = ["Yes", "Sometimes", "No", "Haven't tried"];
  const canSquat = typeof canSquatAnswer === "number" ? canSquatOptions[canSquatAnswer] : undefined;

  const workoutDurationAnswer = answers[15];
  const durationOptions = ["10–20 min", "20–30 min", "30–45 min", "45–60 min"];
  const workoutDuration = typeof workoutDurationAnswer === "number"
    ? durationOptions[workoutDurationAnswer]
    : "30–45 min";

  return {
    workoutType: quizAnswers.workoutType,
    goal,
    gender,
    ageRange,
    heightCm,
    weightKg,
    bodyType,
    experience,
    trainingFrequency,
    painStatus,
    painLocation,
    painTriggers,
    canSquat,
    workoutDuration,
  };
}
