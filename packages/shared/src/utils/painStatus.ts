import type { PainProfile } from "./exerciseFilter";
import { questions } from "../quiz/questions";

export type PainStatusValue = PainProfile["painStatus"];

const PAIN_STATUS_OPTIONS: PainStatusValue[] = [
  "Healthy",
  "Recovered",
  "Active Symptoms",
];

const PAIN_STATUS_QUESTION_ID = questions.find((q) => q.fieldName === "painStatus")?.id;

export function getPainStatusFromQuizAnswers(
  quizAnswers: { answers?: Record<number, unknown> } | null
): PainStatusValue {
  if (!quizAnswers?.answers || PAIN_STATUS_QUESTION_ID === undefined) return "Healthy";
  const answer = quizAnswers.answers[PAIN_STATUS_QUESTION_ID];
  return typeof answer === "number"
    ? (PAIN_STATUS_OPTIONS[answer] ?? "Healthy")
    : "Healthy";
}
