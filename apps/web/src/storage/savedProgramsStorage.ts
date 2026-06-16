import type { GeneratedPlan } from "@spinefit/shared";
import type { SavedProgram, TrainingDay } from "@/types/workout";

const KEY = "savedPrograms";

export function loadSavedPrograms(): SavedProgram[] {
  try {
    const data = localStorage.getItem(KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? (parsed as SavedProgram[]) : [];
  } catch {
    return [];
  }
}

export function persistSavedPrograms(programs: SavedProgram[]): void {
  localStorage.setItem(KEY, JSON.stringify(programs));
}

// Reverse sync: mirror an in-memory plan back into its source saved program so
// edits made during a workout (add / delete / replace / set changes) durably
// reach the program the user created. Only custom programs are touched — a plan
// whose id has no matching saved program (e.g. an AI-generated plan) is ignored.
//
// Mirrors the forward sync in WorkoutPage by index: program.days[i] pairs with
// plan.workoutDays[i]. The day's stable `id` is preserved; only `name` and
// `exercises` are refreshed from the plan. Extra days with no matching plan day
// are kept as-is.
export function syncPlanToSavedProgram(plan: GeneratedPlan): void {
  try {
    const programs = loadSavedPrograms();
    const index = programs.findIndex((p) => p.id === plan.id);
    if (index === -1) return;

    const program = programs[index];
    const syncedDays: TrainingDay[] = program.days.map((day, i) => {
      const workoutDay = plan.workoutDays[i];
      if (!workoutDay) return day;
      return {
        ...day,
        name: workoutDay.dayName,
        exercises: workoutDay.exercises,
      };
    });

    const nameChanged = program.name !== plan.name;
    const daysChanged =
      JSON.stringify(program.days) !== JSON.stringify(syncedDays);
    if (!nameChanged && !daysChanged) return;

    const updated = [...programs];
    updated[index] = { ...program, name: plan.name, days: syncedDays };
    persistSavedPrograms(updated);
  } catch (error) {
    console.error("Error syncing plan back to saved program:", error);
  }
}
