// Re-export pure logic from shared package
export type { GeneratedPlan, AlternativeSplit } from "@spinefit/shared";
export type { WorkoutDay } from "@spinefit/shared";
export { generateTrainingPlan, getTodaysWorkout, applyVolumeSafetyToLoadedPlan } from "@spinefit/shared";

// Re-export storage functions from web storage layer
export {
  savePlanToLocalStorage,
  loadPlanFromLocalStorage,
  saveAlternativeSplitsToLocalStorage,
  loadAlternativeSplitsFromLocalStorage,
  clearGeneratedPlan,
  switchToAlternativePlan,
  switchToSplit,
  getAvailablePlans,
} from "@/storage/planStorage";
