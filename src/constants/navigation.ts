export const VALID_PAGES = [
  "home",
  "login",
  "register",
  "workout",
  "profile",
  "exerciseSets",
  "exerciseDetails",
  "activeWorkout",
  "history",
  "ai",
  "allExercise",
  "myPlan",
  "availableEquipment",
  "settings",
] as const;

export const STORAGE_KEYS = {
  CURRENT_PAGE: "currentPage",
  WORKOUT_HISTORY: "workoutHistory",
  WORKOUT_EXERCISES: "workoutExercises",
  COMPLETED_WORKOUT_IDS: "completedWorkoutIds",
  GENERATED_PLAN: "generatedPlan",
} as const;
