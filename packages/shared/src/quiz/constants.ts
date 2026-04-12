export const GOAL_OPTIONS = [
  "Muscle Hypertrophy (Build mass safely with back/sciatica history)",
  "Structural Recovery (Reduce pain and restore movement capacity)",
] as const;

export type GoalOption = (typeof GOAL_OPTIONS)[number];

export const GOAL_HYPERTROPHY: GoalOption = GOAL_OPTIONS[0];
export const GOAL_RECOVERY: GoalOption = GOAL_OPTIONS[1];

export const PAIN_STATUS_QUIZ_OPTIONS = [
  "Healthy (I am pain-free, but cautious)",
  "Recovered (Past history of pain/injury)",
  "Active Symptoms (Currently experiencing discomfort)",
] as const;

export type PainStatusQuizOption = (typeof PAIN_STATUS_QUIZ_OPTIONS)[number];

export const PAIN_STATUS_HEALTHY: PainStatusQuizOption = PAIN_STATUS_QUIZ_OPTIONS[0];
export const PAIN_STATUS_RECOVERED: PainStatusQuizOption = PAIN_STATUS_QUIZ_OPTIONS[1];
export const PAIN_STATUS_ACTIVE: PainStatusQuizOption = PAIN_STATUS_QUIZ_OPTIONS[2];