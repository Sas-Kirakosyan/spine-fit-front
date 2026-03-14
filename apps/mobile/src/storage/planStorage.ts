import type { GeneratedPlan, AlternativeSplit } from "@spinefit/shared";
import { applyVolumeSafetyToLoadedPlan } from "@spinefit/shared";
import { storage } from "./storageAdapter";

export async function savePlanToLocalStorage(plan: GeneratedPlan): Promise<void> {
  await storage.setJSON("generatedPlan", plan);
  await storage.setItem("activePlanId", plan.id);
}

export async function saveAlternativeSplitsToLocalStorage(alternatives: AlternativeSplit[]): Promise<void> {
  await storage.setJSON("alternativeSplits", alternatives);
}

export async function loadPlanFromLocalStorage(): Promise<GeneratedPlan | null> {
  try {
    const parsedPlan = await storage.getJSON<GeneratedPlan>("generatedPlan");
    if (!parsedPlan) return null;

    const normalizedPlan = applyVolumeSafetyToLoadedPlan(parsedPlan);

    if (JSON.stringify(parsedPlan) !== JSON.stringify(normalizedPlan)) {
      await storage.setJSON("generatedPlan", normalizedPlan);
    }

    return normalizedPlan;
  } catch (error) {
    console.error("Failed to load plan:", error);
    return null;
  }
}

export async function loadAlternativeSplitsFromLocalStorage(): Promise<AlternativeSplit[]> {
  return (await storage.getJSON<AlternativeSplit[]>("alternativeSplits")) ?? [];
}

export async function clearGeneratedPlan(): Promise<void> {
  await storage.removeItem("generatedPlan");
  await storage.removeItem("activePlanId");
}

export async function switchToAlternativePlan(alternativeId: string): Promise<GeneratedPlan | null> {
  try {
    const plan = await loadPlanFromLocalStorage();
    if (!plan) return null;

    const alternatives = await loadAlternativeSplitsFromLocalStorage();
    if (alternatives.length === 0) return null;

    const alternative = alternatives.find((alt) => alt.id === alternativeId);
    if (!alternative) return null;

    const updatedPlan: GeneratedPlan = {
      ...plan,
      workoutDays: alternative.workoutDays,
      splitType: alternative.splitType,
      name: `${alternative.name} - ${plan.settings.workoutsPerWeek}`,
    };

    await savePlanToLocalStorage(updatedPlan);
    return updatedPlan;
  } catch (error) {
    console.error("Failed to switch to alternative plan:", error);
    return null;
  }
}

export async function switchToSplit(
  splitType: "FULL_BODY" | "FULL_BODY_AB" | "PPL" | "UPPER_LOWER" | "UPPER_LOWER_UPPER" | "BRO_SPLIT" | "FRESH_MUSCLES"
): Promise<GeneratedPlan | null> {
  try {
    const plan = await loadPlanFromLocalStorage();
    if (!plan) return null;

    const alternatives = await loadAlternativeSplitsFromLocalStorage();
    if (alternatives.length === 0) return null;

    const alternative = alternatives.find((alt) => alt.splitType === splitType);
    if (!alternative) return null;

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
          "Fresh Muscle Groups",
      },
    };

    await savePlanToLocalStorage(updatedPlan);
    return updatedPlan;
  } catch (error) {
    console.error("Failed to switch to split:", error);
    return null;
  }
}

export function getAvailablePlans(
  plan: GeneratedPlan | null,
  alternatives: AlternativeSplit[]
): Array<{
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
