import { describe, test, expect } from "vitest";
import {
  getAllReplacementExercises,
  normalizeSearchText,
} from "../replacementExercises";
import type { Exercise } from "../../types/exercise";

function makeExercise(overrides: Partial<Exercise> & { id: number }): Exercise {
  return {
    name: `Exercise ${overrides.id}`,
    description: "",
    category: "strength",
    muscle_groups: [],
    equipment: "bodyweight",
    difficulty: "beginner",
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
    ...overrides,
  };
}

const bicepCurls = makeExercise({
  id: 1,
  name: "Dumbbell Bicep Curls",
  muscle_groups: ["biceps"],
});
const hyperextension = makeExercise({
  id: 2,
  name: "Back Hyperextension",
  muscle_groups: ["erector_spinae", "glutes", "hamstrings"],
});
const gluteBridge = makeExercise({
  id: 3,
  name: "Single-Leg Glute Bridge",
  muscle_groups: ["glutes", "hamstrings"],
});

const target = makeExercise({ id: 99, name: "Target", muscle_groups: ["chest"] });

function search(query: string, all: Exercise[], current: Exercise[] = []) {
  return getAllReplacementExercises({
    allExercises: all,
    replaceExercise: target,
    replaceQuery: query,
    currentExercises: current,
  }).map((e) => e.id);
}

describe("normalizeSearchText", () => {
  test("lowercases, strips diacritics and collapses whitespace", () => {
    expect(normalizeSearchText("   BéncH   Press ")).toBe("bench press");
  });

  test("treats underscores/hyphens as spaces", () => {
    expect(normalizeSearchText("erector_spinae")).toBe("erector spinae");
    expect(normalizeSearchText("leg-biceps")).toBe("leg biceps");
  });

  test("normalizes Russian ё to е", () => {
    expect(normalizeSearchText("Ёлочка")).toBe(normalizeSearchText("елочка"));
  });
});

describe("getAllReplacementExercises search", () => {
  const all = [bicepCurls, hyperextension, gluteBridge];

  test("finds an exercise by exact name", () => {
    expect(search("Back Hyperextension", all)).toEqual([2]);
  });

  test("matches tokens regardless of word order", () => {
    expect(search("curl bicep", all)).toEqual([1]);
  });

  test("partial muscle token matches related exercises", () => {
    expect(search("glute", all).sort()).toEqual([2, 3]);
  });

  test("space matches an underscored muscle code", () => {
    expect(search("erector spinae", all)).toEqual([2]);
  });

  test("is case-insensitive", () => {
    expect(search("HYPEREXTENSION", all)).toEqual([2]);
  });

  test("empty query returns all candidates", () => {
    expect(search("   ", all).sort()).toEqual([1, 2, 3]);
  });

  test("excludes the exercise being replaced and occupied exercises", () => {
    const result = getAllReplacementExercises({
      allExercises: [target, bicepCurls, hyperextension],
      replaceExercise: target,
      replaceQuery: "",
      currentExercises: [target, hyperextension],
    }).map((e) => e.id);
    expect(result).toEqual([1]);
  });

  test("returns nothing when no token matches", () => {
    expect(search("nonexistent", all)).toEqual([]);
  });

  test("caps results at the replacement limit", () => {
    const many = Array.from({ length: 80 }, (_, i) =>
      makeExercise({ id: i + 1, name: `Squat ${i + 1}` }),
    );
    expect(search("squat", many)).toHaveLength(60);
  });
});
