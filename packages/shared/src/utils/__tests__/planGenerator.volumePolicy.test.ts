import { describe, expect, test } from "vitest";
import allExercises from "../../MockData/allExercise.json";
import { generateTrainingPlan } from "../planGenerator";
import type { PlanSettings } from "../../types/planSettings";

const baseSettings: PlanSettings = {
  goal: "Muscle Hypertrophy (Build mass safely with back/sciatica history)",
  workoutsPerWeek: "2 days per week",
  duration: "25 min",
  durationRange: "20–30 min",
  experience: "Intermediate",
  trainingSplit: "Full Body",
  exerciseVariability: "Balanced",
  units: "kg",
  cardio: "Off",
  stretching: "Off",
  painStatus: "Active Symptoms",
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

  // Test removed: loadPlanFromLocalStorage uses localStorage and is not part of the shared package.
  // It should be tested in apps/web where localStorage is available.
});