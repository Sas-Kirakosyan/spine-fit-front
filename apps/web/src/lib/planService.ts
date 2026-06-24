import type { GeneratedPlan, PlanSettings } from "@spinefit/shared";
import { planFieldsConfig } from "@spinefit/shared";
import { supabase } from "@/lib/supabase";
import { clearAllPlannedSets } from "@/storage/plannedSetsStorage";
import type { PlannedSetRow } from "@/storage/plannedSetsStorage";
import { syncPlanToSavedProgram } from "@/storage/savedProgramsStorage";

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

// Backend labels use "Push / Pull / Legs" (spaces around slashes) and may include
// variant suffixes like "×4" or "A / B / C". Map them to the canonical frontend options.
function normalizeTrainingSplit(value: string | undefined): string {
  const defaultSplit = planFieldsConfig.trainingSplit.defaultValue;
  if (!value) return defaultSplit;
  const validOptions = planFieldsConfig.trainingSplit.options;
  if (validOptions.includes(value)) return value;
  const s = value.toLowerCase();
  if (s.includes("push") || s.includes("pull") || s.includes("leg")) return "Push/Pull/Legs";
  if (s.includes("upper") || s.includes("lower")) return "Upper/Lower";
  if (s.startsWith("full body")) return "Full Body";
  if (s.includes("fresh") || s.includes("muscle group")) return "Fresh Muscle Groups";
  return defaultSplit;
}

// Persist the plan to localStorage (in addition to the in-memory cache and
// Supabase) so a cold start knows synchronously whether the user has a plan.
// Without this, hasPlan() is false until the network fetchPlan() resolves, and
// a returning user briefly sees HomePage before being redirected to /workout.
const CACHE_KEY = "userPlan";

function readPlanFromLocalStorage(): GeneratedPlan | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as GeneratedPlan) : null;
  } catch {
    return null;
  }
}

function persistCache(): void {
  try {
    if (cachedPlan) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cachedPlan));
    } else {
      localStorage.removeItem(CACHE_KEY);
    }
  } catch {
    // localStorage is best-effort; the in-memory cache + Supabase remain authoritative.
  }
}

let cachedPlan: GeneratedPlan | null = readPlanFromLocalStorage();

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

async function upsertToSupabase(plan: GeneratedPlan): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  const { error } = await supabase.from("user_plans").upsert(
    { user_id: userId, plan },
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

function enqueueUpsert(plan: GeneratedPlan): void {
  hasUnsyncedLocalChanges = true;
  upsertQueue = upsertQueue
    .then(() => upsertToSupabase(plan))
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

// Lightweight id accessor — avoids structuredClone of the whole plan when a
// caller only needs the id (e.g. keying planned-set overrides on every render).
export function getPlanId(): string | null {
  return cachedPlan?.id ?? null;
}

export function getPlanSettings(): PlanSettings {
  const settings = cachedPlan?.settings ?? defaultPlanSettings;
  return {
    ...settings,
    trainingSplit: normalizeTrainingSplit(settings.trainingSplit),
  };
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
  persistCache();
  notify();
  enqueueUpsert(plan);
  // Mirror edits back into the source saved program (no-op for non-custom plans).
  syncPlanToSavedProgram(plan);
}

export function savePlanSettings(settings: PlanSettings): void {
  if (cachedPlan) {
    cachedPlan = { ...cachedPlan, settings };
    persistCache();
    notify();
    enqueueUpsert(cachedPlan);
  } else {
    notify();
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
  if (settings !== undefined && settings !== null) {
    cachedPlan = { ...plan, settings };
  } else if (settings === null) {
    cachedPlan = { ...plan, settings: defaultPlanSettings };
  } else {
    // settings === undefined: keep plan.settings as-is
    cachedPlan = plan;
  }
  persistCache();
  notify();
  enqueueUpsert(cachedPlan);
}

// Write user-edited set defaults back to the plan's scalar fields so exercise
// cards and warmup generation reflect them. Lossy by design — scalars cannot
// express per-set variance; the planned-sets override map stays the source of
// truth for individual rows.
export function syncExerciseScalarsToPlan(
  exerciseId: number,
  rows: PlannedSetRow[]
): void {
  if (!cachedPlan) return;
  const working = rows.filter((r) => r.type !== "warmup");
  if (working.length === 0) return;

  const sets = working.length;
  const reps = Number(working[0].reps);
  const weights = working
    .map((r) => Number(r.weight))
    .filter((w) => !Number.isNaN(w) && w > 0);

  let changed = false;
  const workoutDays = cachedPlan.workoutDays.map((day) => {
    let dayChanged = false;
    const exercises = day.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;
      const next = {
        ...ex,
        sets,
        // Keep template values when the rows hold nothing meaningful
        // (e.g. bodyweight weight "" or a time-based set left at 0).
        reps: !Number.isNaN(reps) && reps > 0 ? reps : ex.reps,
        weight: weights.length > 0 ? Math.max(...weights) : ex.weight,
      };
      if (
        next.sets === ex.sets &&
        next.reps === ex.reps &&
        next.weight === ex.weight
      ) {
        return ex;
      }
      dayChanged = true;
      return next;
    });
    if (!dayChanged) return day;
    changed = true;
    return { ...day, exercises };
  });

  if (!changed) return;
  savePlan({ ...cachedPlan, workoutDays });
}

export async function clearPlan(): Promise<void> {
  cachedPlan = null;
  persistCache();
  clearAllPlannedSets();
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
    persistCache();
    notify();
    return;
  }
  const { data, error } = await supabase
    .from("user_plans")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("Failed to fetch plan from Supabase:", error);
    return;
  }
  if (data) {
    cachedPlan = (data.plan as GeneratedPlan) ?? null;
  } else {
    cachedPlan = null;
  }
  persistCache();
  notify();
}

export function resetLocalCache(): void {
  cachedPlan = null;
  // Drop the localStorage copy too so the previous user's plan can't leak to
  // another account on the same device (mirrors the in-memory cache reset).
  persistCache();
  // Drop the previous user's set-defaults so they can't leak to another
  // account on the same device (mirrors the in-memory plan cache reset).
  clearAllPlannedSets();
  notify();
}
