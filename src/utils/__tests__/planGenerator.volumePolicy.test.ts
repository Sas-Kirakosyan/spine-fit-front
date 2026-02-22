import { describe, expect, test, vi } from "vitest";
import allExercises from "@/MockData/allExercise.json";
import { generateTrainingPlan, loadPlanFromLocalStorage } from "@/utils/planGenerator";
import type { PlanSettings } from "@/types/planSettings";

const baseSettings: PlanSettings = {
  goal: "Build muscle safely (gym-goer with back or sciatic pain)",
  workoutsPerWeek: "2 days per week",
  duration: "25 min",
  durationRange: "20–30 min",
  experience: "Intermediate",
  trainingSplit: "Full Body",
  exerciseVariability: "Balanced",
  units: "kg",
  cardio: "Off",
  stretching: "Off",
  painStatus: "Yes, currently",
  painLocation: ["Lower back (L5–S1)", "Sciatica"],
  painLevel: 4,
  painTriggers: ["Lifting heavy objects"],
  canSquat: "No",
};

const availableEquipment = [
  "chest_press_machine",
  "seated_cable_row",
  "leg_press",
  "leg_curl_machine",
  "lat_pulldown",
  "leg_extension_machine",
  "bench",
  "cable_machine",
  "bodyweight",
];

describe("generateTrainingPlan volume policy", () => {
  test("falls back to planSettings pain profile when quizAnswers is null and caps sets to 3", () => {
    const plan = generateTrainingPlan(
      allExercises as any,
      {
        ...baseSettings,
        gender: "Female",
      },
      null,
      availableEquipment,
      []
    );

    const sets = plan.workoutDays.flatMap((d) => d.exercises.map((e) => e.sets));
    expect(sets.length).toBeGreaterThan(0);
    expect(Math.max(...sets)).toBeLessThanOrEqual(3);
  });

  test("uses 2 sets for male user with pain and cannot squat in 25 min", () => {
    const plan = generateTrainingPlan(
      allExercises as any,
      {
        ...baseSettings,
        gender: "Male",
      },
      null,
      availableEquipment,
      []
    );

    const sets = plan.workoutDays.flatMap((d) => d.exercises.map((e) => e.sets));
    expect(sets.length).toBeGreaterThan(0);
    expect(new Set(sets)).toEqual(new Set([2]));
  });

  test("normalizes previously saved 4-set plans on load", () => {
    const store: Record<string, string> = {};
    vi.spyOn(global.localStorage, "setItem").mockImplementation((key: string, value: string) => {
      store[key] = value;
    });
    vi.spyOn(global.localStorage, "getItem").mockImplementation((key: string) => {
      return store[key] ?? null;
    });

    const generated = generateTrainingPlan(
      allExercises as any,
      {
        ...baseSettings,
        gender: "Female",
      },
      null,
      availableEquipment,
      []
    );

    const unsafeSavedPlan = {
      ...generated,
      workoutDays: generated.workoutDays.map((day) => ({
        ...day,
        exercises: day.exercises.map((exercise) => ({
          ...exercise,
          sets: 4,
        })),
      })),
    };

    localStorage.setItem("generatedPlan", JSON.stringify(unsafeSavedPlan));
    const loaded = loadPlanFromLocalStorage();

    expect(loaded).not.toBeNull();
    const sets = loaded!.workoutDays.flatMap((d) => d.exercises.map((e) => e.sets));
    expect(Math.max(...sets)).toBeLessThanOrEqual(3);
  });
});