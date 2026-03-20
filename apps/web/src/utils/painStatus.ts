import {
  getPainStatusFromQuizAnswers,
  type PainStatusValue,
} from "@spinefit/shared";

export function getStoredPainStatus(): PainStatusValue {
  try {
    const raw = localStorage.getItem("quizAnswers");
    if (!raw) return "Healthy";
    return getPainStatusFromQuizAnswers(JSON.parse(raw));
  } catch {
    return "Healthy";
  }
}

export function shouldShowPainTracking(): boolean {
  return getStoredPainStatus() !== "Healthy";
}
