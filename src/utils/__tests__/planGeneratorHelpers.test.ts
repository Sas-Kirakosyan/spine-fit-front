import { describe, expect, test } from "vitest";
import {
  enforceFullBodyABRequirements,
  type WorkoutSplit,
} from "@/utils/planGeneratorHelpers";

type GenericExercise = {
  id: number;
  name: string;
  muscle_groups: string[];
  category: string;
  is_back_friendly: boolean;
};

function ex(
  id: number,
  name: string,
  muscle_groups: string[],
  category = "strength"
): GenericExercise {
  return {
    id,
    name,
    muscle_groups,
    category,
    is_back_friendly: true,
  };
}

const split: WorkoutSplit = {
  type: "FULL_BODY_AB",
  name: "Full Body A / B",
  rationale: "",
  days: [
    {
      dayLabel: "Day A",
      focus: ["Lower body", "Push", "Pull", "Core"],
      requiredExerciseTypes: [
        "push_horizontal",
        "pull_horizontal",
        "leg_compound",
        "hamstring_isolation",
        "core_stability",
      ],
    },
    {
      dayLabel: "Day B",
      focus: ["Lower body", "Push", "Pull", "Core"],
      requiredExerciseTypes: [
        "push_horizontal",
        "pull_vertical",
        "leg_compound",
        "leg_isolation",
        "core_stability",
      ],
    },
  ],
};

describe("enforceFullBodyABRequirements", () => {
  test("adds missing Day B leg compound and keeps vertical pull on Day B", () => {
    const chestFly = ex(15, "Chest Fly", ["chest", "front_delts"]);
    const latPulldown = ex(34, "Lat Pulldown (Wide Grip)", ["lats", "upper_back"]);
    const legExtension = ex(407, "Leg Extension", ["quadriceps"]);
    const legCurl = ex(25, "Lying Leg Curl", ["hamstrings"]);
    const birdDog = ex(6, "Bird Dog (Bench or Stability Ball)", ["core_stabilizers"], "core");
    const seatedRow = ex(14, "Seated Cable Row", ["lats", "upper_back"]);
    const legPress = ex(24, "Leg Press", ["quadriceps", "glutes", "hamstrings"]);

    const workoutDays = [
      {
        dayNumber: 0,
        dayName: "Full Body",
        muscleGroups: ["chest", "lats", "upper_back", "quadriceps", "glutes", "hamstrings"],
        exercises: [chestFly, seatedRow, legPress, legCurl, birdDog],
      },
      {
        dayNumber: 1,
        dayName: "Full Body",
        muscleGroups: ["chest", "lats", "upper_back", "quadriceps", "glutes", "hamstrings"],
        exercises: [chestFly, latPulldown, legExtension, birdDog, seatedRow],
      },
    ];

    const allExercises = [
      chestFly,
      latPulldown,
      legExtension,
      birdDog,
      seatedRow,
      legPress,
      legCurl,
    ];

    const result = enforceFullBodyABRequirements(workoutDays, allExercises, split);
    const dayB = result[1].exercises;
    const dayBNames = dayB.map((e) => e.name);

    expect(dayBNames).toContain("Leg Press");
    expect(dayBNames).toContain("Lat Pulldown (Wide Grip)");
    expect(dayBNames).not.toContain("Seated Cable Row");
  });

  test("keeps horizontal pull on Day A when both pull types exist", () => {
    const chestPress = ex(28, "Machine Chest Press", ["chest", "front_delts", "triceps"]);
    const seatedRow = ex(14, "Seated Cable Row", ["lats", "upper_back"]);
    const latPulldown = ex(34, "Lat Pulldown (Wide Grip)", ["lats", "upper_back"]);
    const legPress = ex(24, "Leg Press", ["quadriceps", "glutes", "hamstrings"]);
    const legCurl = ex(25, "Lying Leg Curl", ["hamstrings"]);
    const birdDog = ex(6, "Bird Dog (Bench or Stability Ball)", ["core_stabilizers"], "core");

    const workoutDays = [
      {
        dayNumber: 0,
        dayName: "Full Body",
        muscleGroups: ["chest", "lats", "upper_back", "quadriceps", "glutes", "hamstrings"],
        exercises: [chestPress, seatedRow, latPulldown, legPress, legCurl, birdDog],
      },
      {
        dayNumber: 1,
        dayName: "Full Body",
        muscleGroups: ["chest", "lats", "upper_back", "quadriceps", "glutes", "hamstrings"],
        exercises: [chestPress, latPulldown, legPress, legCurl, birdDog],
      },
    ];

    const allExercises = [chestPress, seatedRow, latPulldown, legPress, legCurl, birdDog];
    const result = enforceFullBodyABRequirements(workoutDays, allExercises, split);
    const dayANames = result[0].exercises.map((e) => e.name);

    expect(dayANames).toContain("Seated Cable Row");
    expect(dayANames).not.toContain("Lat Pulldown (Wide Grip)");
  });
});