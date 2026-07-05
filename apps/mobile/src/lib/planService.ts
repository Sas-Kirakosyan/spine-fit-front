import type { GeneratedPlan } from "@spinefit/shared";
import { supabase } from "./supabase";
import {
  savePlanToLocalStorage,
  loadPlanFromLocalStorage,
  clearGeneratedPlan,
} from "../storage/planStorage";

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/**
 * Persists the plan locally (the source the workout screens read) and mirrors
 * it to the shared user_plans table, so web and mobile see the same plan.
 * The Supabase sync is best-effort: a failure keeps the local copy intact.
 */
export async function savePlan(plan: GeneratedPlan): Promise<void> {
  await savePlanToLocalStorage(plan);
  try {
    const userId = await getUserId();
    if (!userId) return;
    const { error } = await supabase
      .from("user_plans")
      .upsert({ user_id: userId, plan }, { onConflict: "user_id" });
    if (error) {
      console.error("Plan sync to Supabase failed:", error.message);
    }
  } catch (err) {
    console.error("Plan sync to Supabase failed:", err);
  }
}

/**
 * Pulls the signed-in user's plan from Supabase into local storage. Mirrors
 * the web planService.fetchPlan semantics: the server copy wins — no local
 * plan can exist for a signed-out user, and login is the only entry point.
 */
export async function fetchPlan(): Promise<void> {
  const userId = await getUserId();
  if (!userId) {
    await clearGeneratedPlan();
    return;
  }
  const { data, error } = await supabase
    .from("user_plans")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("Failed to fetch plan from Supabase:", error.message);
    return;
  }
  if (data?.plan) {
    await savePlanToLocalStorage(data.plan as GeneratedPlan);
  } else {
    await clearGeneratedPlan();
  }
}

export async function hasPlan(): Promise<boolean> {
  return (await loadPlanFromLocalStorage()) !== null;
}
