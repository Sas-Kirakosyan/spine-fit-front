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
// Set to true whenever a write is enqueued and cleared only after Supabase
// confirms success. If an upsert fails, this stays true so fetchPlan knows the
// server copy is stale and must not overwrite the local cache with it.
let hasUnsyncedLocalChanges = false;

function enqueueUpsert(
  plan: GeneratedPlan,
  settings: PlanSettings | null
): void {
  hasUnsyncedLocalChanges = true;
  upsertQueue = upsertQueue
    .then(() => upsertToSupabase(plan, settings))
    .then(() => {
      hasUnsyncedLocalChanges = false;
    })
    .catch((err) => {
      console.error("Plan sync to Supabase failed:", err);
    });
}

// Returns a deep copy so callers can mutate freely without corrupting the
// cache. In-place mutation of the cached reference would bypass notify() and
// leave subscribers observing inconsistent intermediate state.
export function getPlan(): GeneratedPlan | null {
  return cachedPlan ? structuredClone(cachedPlan) : null;
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
  } else {
    // Settings are kept in memory and will be persisted on the next savePlan
    // call. Warn so the caller knows they will not reach Supabase until then.
    console.warn(
      "savePlanSettings called before a plan exists; settings held in memory only until a plan is saved."
    );
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

  // If the most recent upsert failed, the server copy is behind the local
  // cache. Skip the refresh so we don't replace newer local state with stale
  // server data on e.g. a window-focus refetch.
  if (hasUnsyncedLocalChanges) {
    console.warn(
      "fetchPlan: skipping refresh because local changes have not synced to Supabase."
    );
    return;
  }

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
