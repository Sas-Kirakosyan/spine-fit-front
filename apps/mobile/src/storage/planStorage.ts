import type { GeneratedPlan } from "@spinefit/shared";
import { storage } from "./storageAdapter";

export async function savePlanToLocalStorage(plan: GeneratedPlan): Promise<void> {
  await storage.setJSON("generatedPlan", plan);
  await storage.setItem("activePlanId", plan.id);
}

export async function loadPlanFromLocalStorage(): Promise<GeneratedPlan | null> {
  try {
    return (await storage.getJSON<GeneratedPlan>("generatedPlan")) ?? null;
  } catch (error) {
    console.error("Failed to load plan:", error);
    return null;
  }
}

export async function clearGeneratedPlan(): Promise<void> {
  await storage.removeItem("generatedPlan");
  await storage.removeItem("activePlanId");
}
