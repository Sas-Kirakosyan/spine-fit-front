import { supabase } from "@/lib/supabase";

const CACHE_KEY = "completedWorkoutIds";

let cachedIds: string[] = loadFromLocalStorage();

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function loadFromLocalStorage(): string[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeCacheToLocalStorage(): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cachedIds));
  } catch {
    // localStorage is best-effort; the in-memory cache + Supabase remain authoritative.
  }
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

async function upsertToSupabase(ids: string[]): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  const { error } = await supabase.from("user_completed_workouts").upsert(
    { user_id: userId, ids, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  if (error) {
    throw new Error(
      `Failed to save completed workouts to Supabase: ${error.message}`
    );
  }
}

// Serialize writes so successive setIds calls reach Supabase in order.
let upsertQueue: Promise<void> = Promise.resolve();
let hasUnsyncedLocalChanges = false;

function enqueueUpsert(ids: string[]): void {
  hasUnsyncedLocalChanges = true;
  upsertQueue = upsertQueue
    .then(() => upsertToSupabase(ids))
    .then(() => {
      hasUnsyncedLocalChanges = false;
    })
    .catch((err) => {
      console.error("Completed workouts sync to Supabase failed:", err);
    });
}

export function getIds(): Set<string> {
  return new Set(cachedIds);
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setIds(ids: Set<string> | string[]): void {
  cachedIds = Array.isArray(ids) ? [...ids] : [...ids];
  writeCacheToLocalStorage();
  notify();
  enqueueUpsert(cachedIds);
}

export async function fetchIds(): Promise<void> {
  await upsertQueue;

  if (hasUnsyncedLocalChanges) {
    console.warn(
      "fetchIds: skipping refresh because local changes have not synced to Supabase."
    );
    return;
  }

  const userId = await getUserId();
  if (!userId) {
    cachedIds = [];
    writeCacheToLocalStorage();
    notify();
    return;
  }

  const { data, error } = await supabase
    .from("user_completed_workouts")
    .select("ids")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch completed workouts from Supabase:", error);
    return;
  }

  const remote = Array.isArray(data?.ids)
    ? (data.ids as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  cachedIds = remote;
  writeCacheToLocalStorage();
  notify();
}

export function resetLocalCache(): void {
  cachedIds = [];
  notify();
}
