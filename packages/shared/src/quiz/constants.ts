export const GOAL_OPTIONS = [
  "Build Muscle & Strength",
  "Continue Rehab & Recovery",
] as const;

export type GoalOption = (typeof GOAL_OPTIONS)[number];

export const PAIN_STATUS_QUIZ_OPTIONS = [
  "Active Symptoms (Currently experiencing discomfort)",
  "Recovered (Past history of pain/injury)",
  "Healthy (I am pain-free, but cautious)",
] as const;

export type PainStatusQuizOption = (typeof PAIN_STATUS_QUIZ_OPTIONS)[number];