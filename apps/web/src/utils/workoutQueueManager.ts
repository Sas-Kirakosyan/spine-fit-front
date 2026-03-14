// Re-export pure logic from shared package
export {
  getNextAvailableWorkout,
  getWorkoutsByDay,
  getTodaysUncompletedWorkouts,
  markWorkoutCompleted,
  isWorkoutPlanComplete,
} from "@spinefit/shared";

// Re-export storage functions from web storage layer
export { loadCompletedWorkoutIds, saveCompletedWorkoutIds } from "@/storage/workoutStorage";
