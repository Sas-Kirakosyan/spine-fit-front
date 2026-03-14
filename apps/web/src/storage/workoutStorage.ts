/**
 * Load completed workout IDs from localStorage
 */
export function loadCompletedWorkoutIds(): Set<string> {
  const saved = localStorage.getItem("completedWorkoutIds");
  return saved ? new Set(JSON.parse(saved)) : new Set();
}

/**
 * Save completed workout IDs to localStorage
 */
export function saveCompletedWorkoutIds(ids: Set<string>): void {
  localStorage.setItem("completedWorkoutIds", JSON.stringify([...ids]));
}
