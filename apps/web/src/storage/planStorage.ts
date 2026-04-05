import type { GeneratedPlan } from "@spinefit/shared";

/**
 * Save generated plan to localStorage
 */
export function savePlanToLocalStorage(plan: GeneratedPlan): void {
  try {
    localStorage.setItem("generatedPlan", JSON.stringify(plan));
    localStorage.setItem("activePlanId", plan.id);
    console.log("✅ Saved plan:", {
      id: plan.id,
      size: JSON.stringify(plan).length,
      exercises: plan.workoutDays.reduce((sum, d) => sum + d.exercises.length, 0)
    });
  } catch (error) {
    console.error("Failed to save plan to localStorage:", error);
  }
}

/**
 * Load generated plan from localStorage
 */
export function loadPlanFromLocalStorage(): GeneratedPlan | null {
  try {
    const planData = localStorage.getItem("generatedPlan");
    if (!planData) return null;
    return JSON.parse(planData) as GeneratedPlan;
  } catch (error) {
    console.error("Failed to load plan from localStorage:", error);
    return null;
  }
}

/**
 * Clear generated plan from localStorage
 */
export function clearGeneratedPlan(): void {
  try {
    localStorage.removeItem("generatedPlan");
    localStorage.removeItem("activePlanId");
  } catch (error) {
    console.error("Failed to clear plan from localStorage:", error);
  }
}
