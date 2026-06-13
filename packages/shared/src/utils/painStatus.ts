import type { PainProfile } from "./exerciseFilter";
import { questions } from "../quiz/questions";
import { PAIN_STATUS_QUIZ_OPTIONS } from "../quiz/constants";

export type PainStatusValue = PainProfile["painStatus"];

// Derived from PAIN_STATUS_QUIZ_OPTIONS (the order in which the quiz assigns
// indices) so the saved radio index always maps to the right status, even if
// the quiz options are reordered. The canonical short value is the text before
// the first " (".
const PAIN_STATUS_OPTIONS = PAIN_STATUS_QUIZ_OPTIONS.map(
  (option) => option.split(" (")[0]
) as PainStatusValue[];

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
