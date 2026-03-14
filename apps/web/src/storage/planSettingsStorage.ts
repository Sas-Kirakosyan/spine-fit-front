import type { PlanSettings } from "@spinefit/shared";
import { planFieldsConfig } from "@spinefit/shared";

const STORAGE_KEY = "planSettings";

export function loadPlanSettings(): PlanSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Error loading plan settings:", error);
  }

  return {
    goal: planFieldsConfig.goal.defaultValue,
    workoutsPerWeek: planFieldsConfig.workoutsPerWeek.defaultValue,
    duration: planFieldsConfig.duration.defaultValue,
    experience: planFieldsConfig.experience.defaultValue,
    trainingSplit: planFieldsConfig.trainingSplit.defaultValue,
    exerciseVariability: planFieldsConfig.exerciseVariability.defaultValue,
    units: planFieldsConfig.units.defaultValue,
    cardio: planFieldsConfig.cardio.defaultValue,
    stretching: planFieldsConfig.stretching.defaultValue,
  };
}

export function savePlanSettings(settings: PlanSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving plan settings:", error);
  }
}
