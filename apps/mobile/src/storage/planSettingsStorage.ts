import type { PlanSettings } from "@spinefit/shared";
import { planFieldsConfig } from "@spinefit/shared";
import { storage } from "./storageAdapter";

const STORAGE_KEY = "planSettings";

export async function loadPlanSettings(): Promise<PlanSettings> {
  try {
    const saved = await storage.getJSON<PlanSettings>(STORAGE_KEY);
    if (saved) return saved;
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

export async function savePlanSettings(settings: PlanSettings): Promise<void> {
  await storage.setJSON(STORAGE_KEY, settings);
}
