import type { Exercise } from "@/types/exercise";

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
  workoutsPerWeek: number
): string[][] {
  const splitLower = split.toLowerCase();

  // Push/Pull/Legs split
  if (splitLower.includes("push/pull/legs") || splitLower.includes("ppl")) {
    if (workoutsPerWeek === 6) {
      return [
        ["chest", "front_delts", "triceps"], // Push 1
        ["lats", "upper_back", "rear_delts", "biceps"], // Pull 1
        ["quadriceps", "glutes", "hamstrings"], // Legs 1
        ["chest", "front_delts", "triceps"], // Push 2
        ["lats", "upper_back", "rear_delts", "biceps"], // Pull 2
        ["quadriceps", "glutes", "hamstrings"], // Legs 2
      ];
    }
    // 3-day PPL
    return [
      ["chest", "front_delts", "triceps"], // Push
      ["lats", "upper_back", "rear_delts", "biceps"], // Pull
      ["quadriceps", "glutes", "hamstrings"], // Legs
    ];
  }

  // Upper/Lower split
  if (splitLower.includes("upper/lower")) {
    if (workoutsPerWeek === 4) {
      return [
        ["chest", "lats", "upper_back", "front_delts", "rear_delts"], // Upper 1
        ["quadriceps", "glutes", "hamstrings"], // Lower 1
        ["chest", "lats", "upper_back", "triceps", "biceps"], // Upper 2
        ["quadriceps", "glutes", "hamstrings"], // Lower 2
      ];
    }
    // 2-day Upper/Lower
    return [
      ["chest", "lats", "upper_back", "front_delts", "rear_delts", "triceps", "biceps"], // Upper
      ["quadriceps", "glutes", "hamstrings"], // Lower
    ];
  }

  // Full Body split
  if (splitLower.includes("full body")) {
    const fullBodyGroups = [
      "chest",
      "lats",
      "upper_back",
      "quadriceps",
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
    "quadriceps",
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
  exercisesPerDay: number
): WorkoutDay[] {
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const workoutDays: WorkoutDay[] = [];
  const globalUsedExerciseIds = new Set<number>(); // Track across all days

  muscleGroupsByDay.forEach((muscleGroups, index) => {
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
      dayName: dayNames[index] || `Day ${index + 1}`,
      muscleGroups,
      exercises: dayExercises,
    });
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

  const lowerBodyGroups = new Set(["quadriceps", "glutes", "hamstrings"]);

  console.log("  [Selecting for muscle groups]", targetMuscleGroups, "Max:", maxExercises, "Available exercises:", exercises.length);

  // Prioritize compound movements, especially for Full Body splits
  const sortedExercises = [...exercises].sort((a, b) => {
    const aCompound = a.muscle_groups.length;
    const bCompound = b.muscle_groups.length;

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
        !usedExerciseIds.has(ex.id)
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

    if (targetsRelevantMuscles && !usedExerciseIds.has(exercise.id)) {
      console.log(`    ✓ Additional: ${exercise.name}`);
      selected.push(exercise);
      usedExerciseIds.add(exercise.id);
    }
  }

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

  // Ensure at least one quadriceps and one hamstrings/glute posterior-chain movement when targeted
  const needsQuads = targetMuscleGroups.includes("quadriceps");
  const needsHam = targetMuscleGroups.includes("hamstrings") || targetMuscleGroups.includes("glutes");

  const hasQuads = selected.some((ex) => ex.muscle_groups.includes("quadriceps"));
  const hasHam = selected.some((ex) =>
    ex.muscle_groups.includes("hamstrings") || ex.muscle_groups.includes("glutes")
  );

  const ensureGroup = (muscleGroup: string, allowGlutes: boolean) => {
    const candidate = sortedExercises.find(
      (ex) =>
        ex.muscle_groups.includes(muscleGroup) ||
        (allowGlutes && ex.muscle_groups.includes("glutes"))
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
    ensureGroup("quadriceps", false);
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
