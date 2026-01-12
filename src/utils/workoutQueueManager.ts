import type { GeneratedPlan, WorkoutDay } from "./planGenerator";

/**
 * Get the next available workout (regardless of day)
 * Prioritizes: today's workouts first, then upcoming workouts
 */
export function getNextAvailableWorkout(
  plan: GeneratedPlan,
  completedWorkoutIds: Set<string> = new Set()
): WorkoutDay | null {
  const today = new Date().getDay();
  const adjustedDay = today === 0 ? 6 : today - 1;

  // Step 1: Find uncompleted workouts for TODAY
  const todaysWorkouts = plan.workoutDays.filter((day) => {
    const workoutId = `${plan.id}_${day.dayNumber}_${day.dayName}`;
    return day.dayNumber === adjustedDay && !completedWorkoutIds.has(workoutId);
  });

  if (todaysWorkouts.length > 0) {
    return todaysWorkouts[0]; // Return first uncompleted today's workout
  }

  // Step 2: If all today's workouts done, find next scheduled workout in order
  const nextWorkout = plan.workoutDays.find((day) => {
    const workoutId = `${plan.id}_${day.dayNumber}_${day.dayName}`;
    return !completedWorkoutIds.has(workoutId);
  });

  return nextWorkout || null;
}

/**
 * Get all workouts for a specific day (for same-day multiple workouts)
 */
export function getWorkoutsByDay(
  plan: GeneratedPlan,
  dayNumber: number
): WorkoutDay[] {
  return plan.workoutDays.filter((day) => day.dayNumber === dayNumber);
}

/**
 * Get all uncompleted workouts for today
 */
export function getTodaysUncompletedWorkouts(
  plan: GeneratedPlan,
  completedWorkoutIds: Set<string> = new Set()
): WorkoutDay[] {
  const today = new Date().getDay();
  const adjustedDay = today === 0 ? 6 : today - 1;

  return plan.workoutDays.filter((day) => {
    const workoutId = `${plan.id}_${day.dayNumber}_${day.dayName}`;
    return day.dayNumber === adjustedDay && !completedWorkoutIds.has(workoutId);
  });
}

/**
 * Mark a workout as completed
 */
export function markWorkoutCompleted(
  plan: GeneratedPlan,
  dayNumber: number,
  dayName: string
): string {
  return `${plan.id}_${dayNumber}_${dayName}`;
}

/**
 * Check if all workouts are completed
 */
export function isWorkoutPlanComplete(
  plan: GeneratedPlan,
  completedWorkoutIds: Set<string>
): boolean {
  return plan.workoutDays.every((day) => {
    const workoutId = `${plan.id}_${day.dayNumber}_${day.dayName}`;
    return completedWorkoutIds.has(workoutId);
  });
}

/**
 * Load completed workout IDs from localStorage
 */
export function loadCompletedWorkoutIds(): Set<string> {
  const saved = localStorage.getItem("completedWorkoutIds");
  return saved ? new Set(JSON.parse(saved)) : new Set();
}

/**
 * Save completed workout IDs to localStorage
 */
export function saveCompletedWorkoutIds(ids: Set<string>): void {
  localStorage.setItem("completedWorkoutIds", JSON.stringify([...ids]));
}
