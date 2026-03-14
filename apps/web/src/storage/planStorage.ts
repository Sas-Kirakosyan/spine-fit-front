import type { GeneratedPlan, AlternativeSplit } from "@spinefit/shared";
import { applyVolumeSafetyToLoadedPlan } from "@spinefit/shared";

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
 * Save alternative splits to localStorage (separate from main plan)
 */
export function saveAlternativeSplitsToLocalStorage(alternatives: AlternativeSplit[]): void {
  try {
    localStorage.setItem("alternativeSplits", JSON.stringify(alternatives));
    console.log("✅ Saved alternatives:", alternatives.length);
  } catch (error) {
    console.error("Failed to save alternatives to localStorage:", error);
  }
}

/**
 * Load generated plan from localStorage
 */
export function loadPlanFromLocalStorage(): GeneratedPlan | null {
  try {
    const planData = localStorage.getItem("generatedPlan");
    if (!planData) return null;

    const parsedPlan = JSON.parse(planData) as GeneratedPlan;
    const normalizedPlan = applyVolumeSafetyToLoadedPlan(parsedPlan);

    if (JSON.stringify(parsedPlan) !== JSON.stringify(normalizedPlan)) {
      localStorage.setItem("generatedPlan", JSON.stringify(normalizedPlan));
    }

    return normalizedPlan;
  } catch (error) {
    console.error("Failed to load plan from localStorage:", error);
    return null;
  }
}

/**
 * Load alternative splits from localStorage
 */
export function loadAlternativeSplitsFromLocalStorage(): AlternativeSplit[] {
  try {
    const data = localStorage.getItem("alternativeSplits");
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load alternatives from localStorage:", error);
    return [];
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

/**
 * Switch to an alternative split plan by ID
 * Replaces the current workoutDays with the alternative's workoutDays
 */
export function switchToAlternativePlan(alternativeId: string): GeneratedPlan | null {
  try {
    const plan = loadPlanFromLocalStorage();
    if (!plan) return null;

    // Load alternatives from separate storage
    const alternatives = loadAlternativeSplitsFromLocalStorage();
    if (alternatives.length === 0) {
      console.warn(`[switchToAlternativePlan] No alternative splits found in storage`);
      return null;
    }

    const alternative = alternatives.find((alt) => alt.id === alternativeId);
    if (!alternative) return null;

    const updatedPlan: GeneratedPlan = {
      ...plan,
      workoutDays: alternative.workoutDays,
      splitType: alternative.splitType,
      // Update name to reflect the new split
      name: `${alternative.name} - ${plan.settings.workoutsPerWeek}`,
    };

    savePlanToLocalStorage(updatedPlan);
    return updatedPlan;
  } catch (error) {
    console.error("Failed to switch to alternative plan:", error);
    return null;
  }
}

/**
 * Switch to an alternative split plan by splitType
 * Used by the Swap Workout action sheet
 */
export function switchToSplit(splitType: "FULL_BODY" | "FULL_BODY_AB" | "PPL" | "UPPER_LOWER" | "UPPER_LOWER_UPPER" | "BRO_SPLIT" | "FRESH_MUSCLES"): GeneratedPlan | null {
  try {

    const plan = loadPlanFromLocalStorage();
    if (!plan) return null;

    // Load alternatives from separate storage
    const alternatives = loadAlternativeSplitsFromLocalStorage();
    if (alternatives.length === 0) {
      console.warn(`[switchToSplit] No alternative splits found in storage`);
      return null;
    }

    // Find the alternative with matching splitType
    const alternative = alternatives.find((alt) => alt.splitType === splitType);
    if (!alternative) {
      console.warn(`[switchToSplit] No alternative split found for type: ${splitType}`);
      return null;
    }

    // Create updated plan with new split
    const updatedPlan: GeneratedPlan = {
      ...plan,
      workoutDays: alternative.workoutDays,
      splitType: alternative.splitType,
      name: `${alternative.name} - ${plan.settings.workoutsPerWeek}`,
      settings: {
        ...plan.settings,
        trainingSplit:
          splitType === "BRO_SPLIT" ? "Upper/Lower" :
            splitType === "PPL" ? "Push/Pull/Legs" :
              "Fresh Muscle Groups"
      }
    };

    // Persist the change
    savePlanToLocalStorage(updatedPlan);
    console.log(`[switchToSplit] Successfully switched to ${alternative.name}`);
    return updatedPlan;
  } catch (error) {
    console.error("Failed to switch to split:", error);
    return null;
  }
}

/**
 * Get all available split plans (primary + alternatives)
 * Reads alternatives from separate storage
 */
export function getAvailablePlans(plan: GeneratedPlan | null): Array<{
  id: string;
  name: string;
  splitType: string;
  description: string;
  isPrimary: boolean;
  dayCount: number;
}> {
  if (!plan) return [];

  const plans = [
    {
      id: plan.id,
      name: plan.name,
      splitType: "Primary",
      description: "Your generated primary plan based on quiz answers",
      isPrimary: true,
      dayCount: plan.workoutDays.length,
    },
  ];

  // Load alternatives from separate storage
  const alternatives = loadAlternativeSplitsFromLocalStorage();
  if (alternatives.length > 0) {
    plans.push(
      ...alternatives.map((alt) => ({
        id: alt.id,
        name: alt.name,
        splitType: alt.splitType,
        description: alt.description,
        isPrimary: false,
        dayCount: alt.workoutDays.length,
      }))
    );
  }

  return plans;
}
