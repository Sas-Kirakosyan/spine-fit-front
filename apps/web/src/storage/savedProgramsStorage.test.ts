import { describe, it, expect, beforeEach } from "vitest";
import type { GeneratedPlan, WorkoutDay } from "@spinefit/shared";
import type { Exercise } from "@/types/exercise";
import type { SavedProgram, TrainingDay } from "@/types/workout";
import {
  syncPlanToSavedProgram,
  loadSavedPrograms,
  persistSavedPrograms,
} from "./savedProgramsStorage";

// The shared test setup mocks `localStorage` with a stub whose getItem always
// returns null and whose setItem is a no-op, so it can't round-trip data. These
// tests need real persistence, so install a small in-memory Storage per test.
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

beforeEach(() => {
  global.localStorage = createMemoryStorage();
});

function makeExercise(id: number, name = `ex-${id}`): Exercise {
  return {
    id,
    name,
    description: "",
    category: "",
    muscle_groups: [],
    equipment: "",
    difficulty: "",
    instructions: "",
    video_url: "",
    media: [],
    is_back_friendly: true,
    back_issue_restrictions: [],
    created_at: "",
    updated_at: "",
    sets: 3,
    reps: 10,
    weight: 0,
    weight_unit: "kg",
  };
}

function makeTrainingDay(
  id: string,
  name: string,
  exercises: Exercise[] = []
): TrainingDay {
  return { id, name, exercises };
}

function makeProgram(overrides: Partial<SavedProgram> = {}): SavedProgram {
  return {
    id: "prog-1",
    name: "My Program",
    createdAt: "2026-01-01",
    days: [],
    ...overrides,
  };
}

function makeWorkoutDay(
  dayNumber: number,
  dayName: string,
  exercises: Exercise[] = []
): WorkoutDay {
  return { dayNumber, dayName, muscleGroups: [], exercises };
}

function makePlan(overrides: Partial<GeneratedPlan> = {}): GeneratedPlan {
  return {
    id: "prog-1",
    name: "My Program",
    splitType: "",
    weeks: 4,
    createdAt: "2026-01-01",
    settings: {} as GeneratedPlan["settings"],
    workoutDays: [],
    missingMuscleGroups: [],
    alternativeExercises: [],
    ...overrides,
  };
}

describe("syncPlanToSavedProgram", () => {
  it("does nothing when no saved program matches the plan id", () => {
    persistSavedPrograms([makeProgram({ id: "prog-1" })]);
    const plan = makePlan({ id: "ai-plan-999", name: "Changed" });

    syncPlanToSavedProgram(plan);

    const [stored] = loadSavedPrograms();
    expect(stored.id).toBe("prog-1");
    expect(stored.name).toBe("My Program"); // untouched
  });

  it("does nothing when there are no saved programs at all", () => {
    syncPlanToSavedProgram(makePlan());
    expect(loadSavedPrograms()).toEqual([]);
  });

  it("mirrors a day's name and exercises back into the matching program", () => {
    persistSavedPrograms([
      makeProgram({
        days: [makeTrainingDay("day-a", "Old Day", [makeExercise(1)])],
      }),
    ]);

    syncPlanToSavedProgram(
      makePlan({
        workoutDays: [makeWorkoutDay(1, "New Day", [makeExercise(2)])],
      })
    );

    const [stored] = loadSavedPrograms();
    expect(stored.days).toHaveLength(1);
    expect(stored.days[0].name).toBe("New Day");
    expect(stored.days[0].exercises.map((e) => e.id)).toEqual([2]);
  });

  it("preserves the stable day id, refreshing only name and exercises", () => {
    persistSavedPrograms([
      makeProgram({ days: [makeTrainingDay("stable-id", "Old", [])] }),
    ]);

    syncPlanToSavedProgram(
      makePlan({ workoutDays: [makeWorkoutDay(1, "New", [makeExercise(7)])] })
    );

    const [stored] = loadSavedPrograms();
    expect(stored.days[0].id).toBe("stable-id"); // id is not taken from the plan
    expect(stored.days[0].name).toBe("New");
  });

  it("keeps extra program days that have no matching plan day (partial match)", () => {
    persistSavedPrograms([
      makeProgram({
        days: [
          makeTrainingDay("day-a", "Day A", [makeExercise(1)]),
          makeTrainingDay("day-b", "Day B", [makeExercise(2)]),
        ],
      }),
    ]);

    // Plan only has one day — the second program day must survive untouched.
    syncPlanToSavedProgram(
      makePlan({
        workoutDays: [makeWorkoutDay(1, "Day A Updated", [makeExercise(11)])],
      })
    );

    const [stored] = loadSavedPrograms();
    expect(stored.days).toHaveLength(2);
    expect(stored.days[0].name).toBe("Day A Updated");
    expect(stored.days[0].exercises.map((e) => e.id)).toEqual([11]);
    // Untouched leftover day.
    expect(stored.days[1]).toEqual(
      makeTrainingDay("day-b", "Day B", [makeExercise(2)])
    );
  });

  it("updates the program name even when the days are unchanged", () => {
    persistSavedPrograms([
      makeProgram({
        name: "Old Name",
        days: [makeTrainingDay("day-a", "Day A", [makeExercise(1)])],
      }),
    ]);

    syncPlanToSavedProgram(
      makePlan({
        name: "Renamed",
        workoutDays: [makeWorkoutDay(1, "Day A", [makeExercise(1)])],
      })
    );

    expect(loadSavedPrograms()[0].name).toBe("Renamed");
  });

  it("does not rewrite storage when nothing changed", () => {
    const program = makeProgram({
      name: "Same",
      days: [makeTrainingDay("day-a", "Day A", [makeExercise(1)])],
    });
    persistSavedPrograms([program]);

    // Spy on setItem to prove the no-op early return is taken.
    let writes = 0;
    const original = global.localStorage.setItem.bind(global.localStorage);
    global.localStorage.setItem = (k: string, v: string) => {
      writes += 1;
      original(k, v);
    };

    syncPlanToSavedProgram(
      makePlan({
        name: "Same",
        workoutDays: [makeWorkoutDay(1, "Day A", [makeExercise(1)])],
      })
    );

    expect(writes).toBe(0);
  });

  it("leaves other programs in the list untouched", () => {
    const other = makeProgram({ id: "prog-2", name: "Other" });
    persistSavedPrograms([
      makeProgram({
        id: "prog-1",
        days: [makeTrainingDay("day-a", "Day A", [])],
      }),
      other,
    ]);

    syncPlanToSavedProgram(
      makePlan({ id: "prog-1", workoutDays: [makeWorkoutDay(1, "Updated", [])] })
    );

    const stored = loadSavedPrograms();
    expect(stored).toHaveLength(2);
    expect(stored.find((p) => p.id === "prog-2")).toEqual(other);
  });

  it("does not throw when stored data is corrupted JSON", () => {
    global.localStorage.setItem("savedPrograms", "{not valid json");
    expect(() => syncPlanToSavedProgram(makePlan())).not.toThrow();
  });
});
