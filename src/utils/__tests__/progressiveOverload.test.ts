import { describe, expect, test } from "vitest";
import type { Exercise } from "@/types/exercise";
import type { FinishedWorkoutSummary } from "@/types/workout";
import { getLastPerformedData } from "@/utils/progressiveOverload";

function createExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 1,
    name: "Machine Chest Press",
    description: "",
    category: "strength",
    muscle_groups: ["chest"],
    equipment: "chest_press_machine",
    difficulty: "beginner",
    instructions: "",
    video_url: "",
    media: [],
    is_back_friendly: true,
    back_issue_restrictions: [],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    sets: 3,
    reps: 10,
    weight: 80,
    weight_unit: "kg",
    ...overrides,
  };
}

function createWorkoutSummary(
  exercise: Exercise,
  sets: Array<{ id: string; reps: string; weight: string; completed: boolean }>
): FinishedWorkoutSummary {
  return {
    id: "w1",
    finishedAt: "2026-01-30T06:00:00.000Z",
    duration: "30 min",
    totalVolume: 0,
    exerciseCount: 1,
    caloriesBurned: 0,
    completedExercises: [exercise],
    completedExerciseLogs: {
      [exercise.id]: sets,
    },
  };
}

describe("progressiveOverload.getLastPerformedData", () => {
  test("normalizes lbs-like logs near reference load and filters invalid set entries", () => {
    const exercise = createExercise({ id: 28, weight: 80 });
    const history: FinishedWorkoutSummary[] = [
      createWorkoutSummary(exercise, [
        { id: "s1", reps: "13", weight: "178.5", completed: true },
        { id: "s2", reps: "13", weight: "178.5", completed: true },
        { id: "s3", reps: "13", weight: "178.5", completed: true },
        { id: "s4", reps: "12", weight: "178.5", completed: true },
        { id: "s5", reps: "0", weight: "178.5", completed: true },
        { id: "s6", reps: "abc", weight: "-10", completed: true },
      ]),
    ];

    const result = getLastPerformedData(exercise.id, history, exercise.weight);

    expect(result).toBeDefined();
    expect(result?.sets).toHaveLength(4);
    expect(result?.averageWeight).toBeCloseTo(80.966, 3);
    expect(result?.averageReps).toBeCloseTo(12.75, 2);
  });

  test("caps corrupted excessive loads using conservative upper bound", () => {
    const exercise = createExercise({ id: 14, weight: 50 });
    const history: FinishedWorkoutSummary[] = [
      createWorkoutSummary(exercise, [
        { id: "s1", reps: "10", weight: "1000", completed: true },
      ]),
    ];

    const result = getLastPerformedData(exercise.id, history, exercise.weight);

    expect(result).toBeDefined();
    expect(result?.averageWeight).toBe(130);
  });
});