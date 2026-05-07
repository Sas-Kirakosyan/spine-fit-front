import { parseBodyWeightToKg, questions, type CalorieGender } from "@spinefit/shared";

const KEY = "bodyProfile";
const QUIZ_KEY = "quizAnswers";

interface StoredBodyProfile {
  height?: string;
  weight?: string;
  units?: { height?: "cm" | "ft"; weight?: "kg" | "lbs" };
}

export function getBodyProfile(): StoredBodyProfile | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredBodyProfile;
  } catch {
    return null;
  }
}

export function getBodyWeightKg(): number | undefined {
  const profile = getBodyProfile();
  if (!profile) return undefined;
  return parseBodyWeightToKg(profile.weight, profile.units?.weight);
}

export function getStoredGender(): CalorieGender | undefined {
  const raw = localStorage.getItem(QUIZ_KEY);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as { answers?: Record<number, unknown> };
    const genderQuestionId = questions.find((q) => q.fieldName === "gender")?.id;
    if (genderQuestionId === undefined) return undefined;
    const value = parsed.answers?.[genderQuestionId];
    if (value === 0) return "male";
    if (value === 1) return "female";
    if (value === 2) return "other";
    return undefined;
  } catch {
    return undefined;
  }
}
