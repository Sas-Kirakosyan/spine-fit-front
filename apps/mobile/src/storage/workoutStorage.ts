import { storage } from "./storageAdapter";

export async function loadCompletedWorkoutIds(): Promise<Set<string>> {
  const saved = await storage.getJSON<string[]>("completedWorkoutIds");
  return saved ? new Set(saved) : new Set();
}

export async function saveCompletedWorkoutIds(ids: Set<string>): Promise<void> {
  await storage.setJSON("completedWorkoutIds", [...ids]);
}
