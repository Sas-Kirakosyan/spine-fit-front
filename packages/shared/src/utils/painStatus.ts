import type { PainProfile } from "./exerciseFilter";

export type PainStatusValue = PainProfile["painStatus"];

const PAIN_STATUS_OPTIONS: PainStatusValue[] = [
  "Healthy",
  "Recovered",
  "Active Symptoms",
];

export function getPainStatusFromQuizAnswers(
  quizAnswers: { answers?: Record<number, unknown> } | null
): PainStatusValue {
  if (!quizAnswers?.answers) return "Healthy";
  const answer = quizAnswers.answers[10];
  return typeof answer === "number"
    ? (PAIN_STATUS_OPTIONS[answer] ?? "Healthy")
    : "Healthy";
}
