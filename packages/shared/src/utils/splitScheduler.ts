import type { Exercise } from "../types/exercise";

export interface WorkoutDay {
  dayNumber: number;
  dayName: string;
  muscleGroups: string[];
  exercises: Exercise[];
}

export interface WeeklySchedule {
  split: string;
  workoutsPerWeek: number;
  restDays: number[];
  workoutDays: WorkoutDay[];
}

/**
 * Create a weekly workout schedule based on training split and frequency
 */
export function createWeeklySchedule(
  split: string,
  workoutsPerWeek: number
): Omit<WeeklySchedule, "workoutDays"> {
  const workoutDayNumbers = distributeWorkoutDays(workoutsPerWeek);
  const restDays = [0, 1, 2, 3, 4, 5, 6].filter(
    (day) => !workoutDayNumbers.includes(day)
  );

  return {
    split,
    workoutsPerWeek,
    restDays,
  };
}

/**
 * Distribute workout days evenly throughout the week
 */
function distributeWorkoutDays(workoutsPerWeek: number): number[] {
  // Map workout frequency to specific days (0 = Monday, 6 = Sunday)
  const schedules: Record<number, number[]> = {
    2: [0, 3], // Mon, Thu
    3: [0, 2, 4], // Mon, Wed, Fri
    4: [0, 1, 3, 4], // Mon, Tue, Thu, Fri
    5: [0, 1, 2, 4, 5], // Mon, Tue, Wed, Fri, Sat
    6: [0, 1, 2, 3, 4, 5], // Mon-Sat
    7: [0, 1, 2, 3, 4, 5, 6], // Every day
  };

  return schedules[workoutsPerWeek] || schedules[3];
}

/**
 * Map training split to muscle group targets per day
 */
export function mapSplitToMuscleGroups(
  split: string,
  workoutsPerWeek: number,
  splitType?: string
): string[][] {
  const splitLower = split.toLowerCase();

  // Push/Pull/Legs split
  if (splitLower.includes("push/pull/legs") || splitLower.includes("ppl")) {
    if (workoutsPerWeek === 5) {
      return [
        ["chest", "front_delts", "triceps"],            // Push A
        ["lats", "upper_back", "rear_delts", "biceps"], // Pull A
        ["quads", "glutes", "hamstrings"],          // Legs
        ["chest", "front_delts", "triceps"],            // Push B
        ["lats", "upper_back", "rear_delts", "biceps"], // Pull B
      ];
    }
    if (workoutsPerWeek === 6) {
      return [
        ["chest", "front_delts", "triceps"], // Push 1
        ["lats", "upper_back", "rear_delts", "biceps"], // Pull 1
        ["quads", "glutes", "hamstrings"], // Legs 1
        ["chest", "front_delts", "triceps"], // Push 2
        ["lats", "upper_back", "rear_delts", "biceps"], // Pull 2
        ["quads", "glutes", "hamstrings"], // Legs 2
      ];
    }
    // 3-day PPL
    return [
      ["chest", "front_delts", "triceps"], // Push
      ["lats", "upper_back", "rear_delts", "biceps"], // Pull
      ["quads", "glutes", "hamstrings"], // Legs
    ];
  }

  // Upper/Lower split
  if (splitLower.includes("upper/lower")) {
    if (workoutsPerWeek === 5) {
      return [
        ["chest", "lats", "upper_back", "front_delts", "rear_delts"], // Upper A
        ["quads", "glutes", "hamstrings", "core_stabilizers"],    // Lower A
        ["core_stabilizers"],                                          // Rest Day
        ["chest", "lats", "upper_back", "triceps", "biceps"],         // Upper B
        ["quads", "glutes", "hamstrings", "core_stabilizers"],    // Lower B
      ];
    }
    if (workoutsPerWeek === 4) {
      return [
        ["chest", "lats", "upper_back", "front_delts", "rear_delts"], // Upper 1
        ["quads", "glutes", "hamstrings", "core_stabilizers"], // Lower 1
        ["chest", "lats", "upper_back", "triceps", "biceps"], // Upper 2
        ["quads", "glutes", "hamstrings", "core_stabilizers"], // Lower 2
      ];
    }
    // 3-day Alternating ULU/LUL (6 workout days: Upper A / Lower A / Upper B / Lower B / Upper C / Lower C)
    if (workoutsPerWeek === 3 && splitType === "UPPER_LOWER_ALTERNATING") {
      return [
        ["chest", "lats", "upper_back", "front_delts", "rear_delts", "triceps", "biceps"], // Upper A
        ["quads", "glutes", "hamstrings", "core_stabilizers"],                              // Lower A (quad-led)
        ["lats", "upper_back", "rear_delts", "biceps", "chest", "front_delts", "triceps"], // Upper B
        ["glutes", "hamstrings", "quads", "core_stabilizers"],                              // Lower B (glute-led)
        ["chest", "lats", "upper_back", "front_delts", "rear_delts", "triceps", "biceps"], // Upper C
        ["quads", "glutes", "hamstrings", "core_stabilizers"],                              // Lower C
      ];
    }
    // 3-day Upper/Lower/Upper (ULU)
    if (workoutsPerWeek === 3) {
      return [
        ["chest", "lats", "upper_back", "front_delts", "rear_delts", "triceps", "biceps"], // Upper A
        ["quads", "glutes", "hamstrings", "core_stabilizers"],                          // Lower
        ["lats", "upper_back", "rear_delts", "biceps", "chest", "front_delts", "triceps"],  // Upper B
      ];
    }
    // 2-day Upper/Lower
    return [
      ["chest", "lats", "upper_back", "front_delts", "rear_delts", "triceps", "biceps"], // Upper
      ["quads", "glutes", "hamstrings"], // Lower
    ];
  }

  // Full Body split
  if (splitLower.includes("full body")) {
    const fullBodyGroups = [
      "chest",
      "lats",
      "upper_back",
      "quads",
      "glutes",
      "hamstrings",
    ];
    // Return the same muscle groups for each workout day
    return Array(workoutsPerWeek).fill(fullBodyGroups);
  }

  // Fresh Muscle Groups (default to full body variation)
  return Array(workoutsPerWeek).fill([
    "chest",
    "lats",
    "upper_back",
    "quads",
    "glutes",
    "hamstrings",
    "core_stabilizers",
  ]);
}

/**
 * Assign exercises to workout days based on muscle groups
 */
export function assignExercisesToDays(
  exercises: Exercise[],
  muscleGroupsByDay: string[][],
  exercisesPerDay: number,
  splitLabel: string
): WorkoutDay[] {
  const dayNamesBySplit: Record<string, string[]> = {
    "push/pull/legs": ["Push A", "Pull A", "Legs A", "Push B", "Pull B", "Legs B", "Push C"],
    "upper/lower": ["Upper A", "Lower A", "Upper B", "Lower B", "Upper C", "Lower C", "Upper D"],
    "lower/upper/lower": ["Lower A", "Upper", "Lower B"],
    "full body": Array(7).fill("Full Body"),
  };

  const splitKey = splitLabel.toLowerCase();
  const dayNames = dayNamesBySplit[splitKey] || [
    "Day 1",
    "Day 2",
    "Day 3",
    "Day 4",
    "Day 5",
    "Day 6",
    "Day 7",
  ];
  const workoutDays: WorkoutDay[] = [];
  const globalUsedExerciseIds = new Set<number>(); // Track across all days
  let nonRestDayCounter = 0;

  muscleGroupsByDay.forEach((muscleGroups, index) => {
    const isRestDay =
      muscleGroups.length === 1 && muscleGroups[0] === "core_stabilizers";

    // Rest days: select only stability/mobility core exercises, max 2
    if (isRestDay) {
      const stabilityPatterns = /plank|bird\s*dog|dead\s*bug|hollow|stability/i;
      const coreOnlyExercises = exercises
        .filter(ex =>
          (ex as any).category === "core" &&
          !globalUsedExerciseIds.has(ex.id) &&
          stabilityPatterns.test(ex.name)
        )
        .slice(0, 2);
      coreOnlyExercises.forEach(ex => globalUsedExerciseIds.add(ex.id));

      workoutDays.push({
        dayNumber: index,
        dayName: "Active Recovery",
        muscleGroups,
        exercises: coreOnlyExercises,
      });
      return;
    }

    const dayExercises = selectExercisesForMuscleGroups(
      exercises,
      muscleGroups,
      exercisesPerDay,
      globalUsedExerciseIds // Pass global tracker
    );

    // Add selected exercises to global tracker
    dayExercises.forEach((ex) => globalUsedExerciseIds.add(ex.id));

    workoutDays.push({
      dayNumber: index,
      dayName: dayNames[nonRestDayCounter] || `Day ${index + 1}`,
      muscleGroups,
      exercises: dayExercises,
    });

    nonRestDayCounter++;
  });

  return workoutDays;
}

/**
 * Select exercises that target specific muscle groups
 */
function selectExercisesForMuscleGroups(
  exercises: Exercise[],
  targetMuscleGroups: string[],
  maxExercises: number,
  globalUsedIds: Set<number> = new Set()
): Exercise[] {
  const selected: Exercise[] = [];
  const usedExerciseIds = new Set<number>(globalUsedIds); // Start with globally used IDs

  const lowerBodyGroups = new Set(["quads", "glutes", "hamstrings"]);
  const dayTargetsLowerBody = targetMuscleGroups.some((mg) => lowerBodyGroups.has(mg));
  const targetsCore = targetMuscleGroups.includes("core_stabilizers");

  // Fix 1: Guard against primarily-lower-body exercises appearing on upper-only days
  const isPrimarilyLowerBody = (exercise: Exercise): boolean => {
    const lowerCount = exercise.muscle_groups.filter(
      (mg) => lowerBodyGroups.has(mg) || mg === "erector_spinae"
    ).length;
    return lowerCount > exercise.muscle_groups.length / 2;
  };

  console.log("  [Selecting for muscle groups]", targetMuscleGroups, "Max:", maxExercises, "Available exercises:", exercises.length);

  // Prioritize compound movements, especially for Full Body splits
  const sortedExercises = [...exercises].sort((a, b) => {
    const aCompound = a.muscle_groups.length;
    const bCompound = b.muscle_groups.length;

    const isCore = (ex: Exercise) =>
      ex.category === "core" || ex.muscle_groups.includes("core_stabilizers");
    const aIsCore = isCore(a);
    const bIsCore = isCore(b);

    // When day does not target core, push core/rehab-style moves later
    if (!targetsCore && aIsCore !== bIsCore) {
      return aIsCore ? 1 : -1; // non-core first
    }

    // For Full Body splits, prioritize multi-joint leg exercises for hamstring coverage
    const isFullBodyLegExercise = (ex: Exercise) =>
      (ex.name.includes("Belt Squat") || ex.name.includes("Bulgarian")) &&
      targetMuscleGroups.includes("hamstrings");

    const aIsFullBodyLeg = isFullBodyLegExercise(a);
    const bIsFullBodyLeg = isFullBodyLegExercise(b);

    if (aIsFullBodyLeg && !bIsFullBodyLeg) return -1;
    if (!aIsFullBodyLeg && bIsFullBodyLeg) return 1;

    return bCompound - aCompound;
  });

  // First pass: select at least one exercise per major muscle group
  for (const muscleGroup of targetMuscleGroups) {
    const exercise = sortedExercises.find(
      (ex) =>
        ex.muscle_groups.includes(muscleGroup) &&
        !usedExerciseIds.has(ex.id) &&
        // avoid core moves on non-core days
        (targetsCore || (ex.category !== "core" && !ex.muscle_groups.includes("core_stabilizers"))) &&
        // Fix 1: skip primarily-lower-body exercises on upper-only days
        (dayTargetsLowerBody || !isPrimarilyLowerBody(ex))
    );

    if (exercise && selected.length < maxExercises) {
      console.log(`    ✓ Found for ${muscleGroup}: ${exercise.name}`);
      selected.push(exercise);
      usedExerciseIds.add(exercise.id);
    } else {
      console.log(`    ✗ NO exercise found for ${muscleGroup}`);
    }
  }

  // Second pass: fill remaining slots with exercises targeting any muscle group
  for (const exercise of sortedExercises) {
    if (selected.length >= maxExercises) {
      break;
    }

    const targetsRelevantMuscles = exercise.muscle_groups.some((mg) =>
      targetMuscleGroups.includes(mg)
    );

    // skip core if day doesn't target core
    const isCore = exercise.category === "core" || exercise.muscle_groups.includes("core_stabilizers");
    if (!targetsCore && isCore) {
      continue;
    }

    // Fix 1: skip primarily-lower-body exercises on upper-only days
    if (!dayTargetsLowerBody && isPrimarilyLowerBody(exercise)) {
      continue;
    }

    if (targetsRelevantMuscles && !usedExerciseIds.has(exercise.id)) {
      console.log(`    ✓ Additional: ${exercise.name}`);
      selected.push(exercise);
      usedExerciseIds.add(exercise.id);
    }
  }

  // Only ensure lower-body coverage if the day actually targets lower body muscles
  if (dayTargetsLowerBody) {
    // Ensure we have at least one lower-body movement (quads/glutes/hamstrings)
    const hasLowerBody = selected.some((ex) =>
      ex.muscle_groups.some((mg) => lowerBodyGroups.has(mg))
    );

    if (!hasLowerBody) {
      const lowerBodyExercise = sortedExercises.find(
        (ex) =>
          ex.muscle_groups.some((mg) => lowerBodyGroups.has(mg)) &&
          !usedExerciseIds.has(ex.id)
      );

      if (lowerBodyExercise) {
        if (selected.length < maxExercises) {
          selected.push(lowerBodyExercise);
        } else if (selected.length > 0) {
          // Replace the last non-lower-body exercise to maintain count
          const replaceIndex = selected.findIndex(
            (ex) => !ex.muscle_groups.some((mg) => lowerBodyGroups.has(mg))
          );
          if (replaceIndex !== -1) {
            selected[replaceIndex] = lowerBodyExercise;
          }
        }
        usedExerciseIds.add(lowerBodyExercise.id);
      }
    }
  }

  // For Upper days, ensure push/pull balance - must have at least one major back compound
  const dayTargetsUpperBody =
    targetMuscleGroups.includes("chest") ||
    targetMuscleGroups.includes("lats") ||
    targetMuscleGroups.includes("upper_back");

  if (dayTargetsUpperBody) {
    const backMuscles = new Set(["lats", "upper_back"]);
    const hasMajorBackCompound = selected.some((ex) =>
      ex.muscle_groups.some((mg) => backMuscles.has(mg)) &&
      (ex.name.toLowerCase().includes("row") ||
        ex.name.toLowerCase().includes("pull") ||
        ex.name.toLowerCase().includes("lat"))
    );

    if (!hasMajorBackCompound && targetMuscleGroups.some(mg => backMuscles.has(mg))) {
      const backCompound = sortedExercises.find(
        (ex) =>
          ex.muscle_groups.some((mg) => backMuscles.has(mg)) &&
          (ex.name.toLowerCase().includes("row") ||
            ex.name.toLowerCase().includes("pull") ||
            ex.name.toLowerCase().includes("lat")) &&
          !usedExerciseIds.has(ex.id)
      );

      if (backCompound) {
        if (selected.length < maxExercises) {
          selected.push(backCompound);
          console.log(`    ✓ Added back compound for balance: ${backCompound.name}`);
        } else if (selected.length > 0) {
          // Replace a redundant push exercise to maintain balance
          const pushIndex = selected.findIndex(
            (ex) =>
              (ex.muscle_groups.includes("chest") || ex.muscle_groups.includes("triceps")) &&
              !ex.muscle_groups.some((mg) => backMuscles.has(mg))
          );
          if (pushIndex !== -1 && pushIndex > 0) { // Keep at least the first push exercise
            selected[pushIndex] = backCompound;
            console.log(`    ✓ Replaced push exercise with back compound: ${backCompound.name}`);
          }
        }
        usedExerciseIds.add(backCompound.id);
      }
    }
  }

  // Ensure at least one quads and one hamstrings/glute posterior-chain movement when targeted
  const needsQuads = targetMuscleGroups.includes("quads");
  const needsHam = targetMuscleGroups.includes("hamstrings") || targetMuscleGroups.includes("glutes");

  const hasQuads = selected.some((ex) => ex.muscle_groups.includes("quads"));
  const hasHam = selected.some((ex) =>
    ex.muscle_groups.includes("hamstrings") || ex.muscle_groups.includes("glutes")
  );

  const ensureGroup = (muscleGroup: string, allowGlutes: boolean) => {
    const candidate = sortedExercises.find(
      (ex) =>
        !usedExerciseIds.has(ex.id) &&
        (ex.muscle_groups.includes(muscleGroup) ||
        (allowGlutes && ex.muscle_groups.includes("glutes")))
    );

    if (!candidate) return;

    if (!selected.includes(candidate)) {
      if (selected.length < maxExercises) {
        selected.push(candidate);
      } else {
        const replaceIndex = selected.findIndex(
          (ex) =>
            !ex.muscle_groups.includes(muscleGroup) &&
            !(allowGlutes && ex.muscle_groups.includes("glutes"))
        );
        if (replaceIndex !== -1) {
          selected[replaceIndex] = candidate;
        }
      }
    }
  };

  if (needsQuads && !hasQuads) {
    ensureGroup("quads", false);
  }

  if (needsHam && !hasHam) {
    ensureGroup("hamstrings", true);
  }

  console.log(`  [Result] Selected ${selected.length} exercises`);
  return selected;
}

/**
 * Get missing muscle groups that aren't covered by exercises
 */
export function getMissingMuscleGroups(
  targetMuscleGroups: string[],
  exercises: Exercise[]
): string[] {
  const coveredMuscleGroups = new Set<string>();

  exercises.forEach((exercise) => {
    exercise.muscle_groups.forEach((mg) => coveredMuscleGroups.add(mg));
  });

  return targetMuscleGroups.filter((mg) => !coveredMuscleGroups.has(mg));
}
