import type { GeneratedPlan, PlanSettings } from "@spinefit/shared";
import { planFieldsConfig } from "@spinefit/shared";
import { supabase } from "@/lib/supabase";

const defaultPlanSettings: PlanSettings = {
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

let cachedPlan: GeneratedPlan | null = null;
let cachedSettings: PlanSettings | null = null;

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

async function upsertToSupabase(
  plan: GeneratedPlan,
  settings: PlanSettings | null
): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  const { error } = await supabase.from("user_plans").upsert(
    { user_id: userId, plan, settings },
    { onConflict: "user_id" }
  );
  if (error) {
    throw new Error(`Failed to save plan to Supabase: ${error.message}`);
  }
}

// Serialize all writes so requests reach Supabase in the order they were made.
// Without this, fire-and-forget upserts could land out of order and an older
// snapshot could overwrite a newer one.
let upsertQueue: Promise<void> = Promise.resolve();

function enqueueUpsert(
  plan: GeneratedPlan,
  settings: PlanSettings | null
): void {
  upsertQueue = upsertQueue
    .then(() => upsertToSupabase(plan, settings))
    .catch((err) => {
      console.error("Plan sync to Supabase failed:", err);
    });
}

export function getPlan(): GeneratedPlan | null {
  return cachedPlan;
}

export function getPlanSettings(): PlanSettings {
  return cachedSettings ?? defaultPlanSettings;
}

export function hasPlan(): boolean {
  return cachedPlan !== null;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function savePlan(plan: GeneratedPlan): void {
  cachedPlan = plan;
  notify();
  enqueueUpsert(plan, cachedSettings);
}

export function savePlanSettings(settings: PlanSettings): void {
  cachedSettings = settings;
  notify();
  if (cachedPlan) {
    enqueueUpsert(cachedPlan, settings);
  }
}

// `settings === undefined` means "leave existing settings as-is"; pass `null`
// to explicitly clear them.
export function savePlanAndSettings(
  plan: GeneratedPlan,
  settings?: PlanSettings | null
): void {
  cachedPlan = plan;
  if (settings !== undefined) {
    cachedSettings = settings;
  }
  notify();
  enqueueUpsert(plan, cachedSettings);
}

export async function clearPlan(): Promise<void> {
  cachedPlan = null;
  cachedSettings = null;
  notify();
  const userId = await getUserId();
  if (!userId) return;
  const { error } = await supabase
    .from("user_plans")
    .delete()
    .eq("user_id", userId);
  if (error) {
    console.error("Failed to clear plan in Supabase:", error);
  }
}

export async function fetchPlan(): Promise<void> {
  // Wait for any in-flight local writes to land on Supabase before reading,
  // otherwise we could overwrite the local cache with stale server data.
  await upsertQueue;
  const userId = await getUserId();
  if (!userId) {
    cachedPlan = null;
    cachedSettings = null;
    notify();
    return;
  }
  const { data, error } = await supabase
    .from("user_plans")
    .select("plan, settings")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("Failed to fetch plan from Supabase:", error);
    return;
  }
  if (data) {
    cachedPlan = (data.plan as GeneratedPlan) ?? null;
    cachedSettings = (data.settings as PlanSettings | null) ?? null;
  } else {
    cachedPlan = null;
    cachedSettings = null;
  }
  notify();
}

export function resetLocalCache(): void {
  cachedPlan = null;
  cachedSettings = null;
  notify();
}
