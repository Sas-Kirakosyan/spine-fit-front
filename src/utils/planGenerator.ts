import type { Exercise } from "@/types/exercise";
import type { PlanSettings } from "@/types/planSettings";
import type { FinishedWorkoutSummary } from "@/types/workout";
import type { QuizAnswers } from "@/types/quiz";

import { filterExercisesByProfile, getAlternativeExercises, type FilterCriteria, type PainProfile } from "./exerciseFilter";
import { mapSplitToMuscleGroups, assignExercisesToDays, getMissingMuscleGroups, createWeeklySchedule, type WorkoutDay } from "./splitScheduler";
import { calculateVolume, calculateExercisesPerWorkout } from "./volumeCalculator";
import { applyProgressionToExercises } from "./progressiveOverload";
import { buildSourceOnboarding, enforceFullBodyABRequirements, type SourceOnboarding } from "./planGeneratorHelpers";

export type { WorkoutDay };

export interface GeneratedPlan {
  id: string;
  name: string;
  splitType: "FULL_BODY_ABC" | "FULL_BODY_AB" | "FULL_BODY_4X" | "UPPER_LOWER_4X" | "UPPER_LOWER_UPPER" | "UPPER_LOWER_STRENGTH_HYPERTROPHY" | "PUSH_PULL_LEGS" | "PPL" | "BRO_SPLIT" | "FRESH_MUSCLES"; // Identifies the plan type
  createdAt: string;
  settings: PlanSettings;
  sourceOnboarding?: SourceOnboarding;
  workoutDays: WorkoutDay[];
  missingMuscleGroups: string[];
  alternativeExercises: Exercise[];
}

export interface AlternativeSplit {
  id: string;
  name: string;
  splitType: "FULL_BODY_ABC" | "FULL_BODY_AB" | "FULL_BODY_4X" | "UPPER_LOWER_4X" | "UPPER_LOWER_UPPER" | "UPPER_LOWER_STRENGTH_HYPERTROPHY" | "PUSH_PULL_LEGS" | "PPL" | "BRO_SPLIT" | "FRESH_MUSCLES";
  description: string;
  workoutDays: WorkoutDay[];
  createdAt: string;
}

const isPress = (e: Exercise) =>
  (e.muscle_groups || []).some((mg) =>
    ["chest", "front_delts", "upper_chest"].includes(mg)
  );

const isPull = (e: Exercise) =>
  (e.muscle_groups || []).some((mg) =>
    ["lats", "upper_back", "rear_delts", "biceps"].includes(mg)
  );

const hasVerticalPull = (e: Exercise): boolean => {
  const name = (e.name || "").toLowerCase();
  const equip = (e.equipment || "").toLowerCase();
  return (
    name.includes("pulldown") ||
    name.includes("pull-up") ||
    name.includes("chin-up") ||
    name.includes("straight-arm") ||
    name.includes("lat pull") ||
    equip.includes("lat_pulldown") ||
    equip.includes("pull_up")
  );
};

const isCoreStability = (e: Exercise): boolean => {
  const category = ((e as any).category || "").toLowerCase();
  const name = (e.name || "").toLowerCase();
  const equipment = (e.equipment || "").toLowerCase();

  // Core stability exercises are bodyweight and focus on hold/control
  const isCore = category.includes("core") || category.includes("abs");
  const isStability =
    name.includes("plank") ||
    name.includes("bird dog") ||
    name.includes("dead bug") ||
    name.includes("hollow") ||
    name.includes("stability");
  const isBodyweight =
    equipment === "bodyweight" ||
    equipment === "none" ||
    equipment === "" ||
    name.includes("bodyweight");

  return (isCore && isStability) || (isStability && isBodyweight);
};

const isRearDeltExercise = (e: Exercise): boolean => {
  const name = (e.name || "").toLowerCase();
  const muscleGroups = e.muscle_groups || [];

  return (
    muscleGroups.includes("rear_delts") ||
    name.includes("face pull") ||
    name.includes("rear delt") ||
    name.includes("reverse fly") ||
    name.includes("reverse pec") ||
    name.includes("external rotation") ||
    name.includes("band pull apart")
  );
};

const dedupeExercises = (list: Exercise[]): Exercise[] => {
  const seen = new Set<number>();
  return list.filter((e) => {
    const id = Number(e.id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const findExerciseByName = (
  allExercises: Exercise[],
  name: string
): Exercise | undefined =>
  allExercises.find((e) => e.name?.toLowerCase() === name.toLowerCase());

const preferAddIfNotPresent = (
  list: Exercise[],
  candidate: Exercise | undefined
): Exercise[] => {
  if (!candidate) return list;
  const exists = list.some((e) => e.id === candidate.id);
  return exists ? list : [...list, candidate];
};

const replaceByName = (
  list: Exercise[],
  targetName: string,
  replacement: Exercise | undefined
): Exercise[] => {
  if (!replacement) return list;
  const idx = list.findIndex(
    (e) => (e.name || "").toLowerCase() === targetName.toLowerCase()
  );
  if (idx === -1) return list;
  const clone = list.slice();
  clone[idx] = replacement;
  return clone;
};

/**
 * Generate alternative split plan options based on training frequency
 * - Upper/Lower: 3+ days/week
 * - PPL: 3+ days/week (pain-free users)
 * - Bro Split (5-day body-part): 5+ days/week only
 */
function generateAlternativeSplits(
  allExercises: Exercise[],
  painProfile: PainProfile,
  frequency: number
): AlternativeSplit[] {
  const alternatives: AlternativeSplit[] = [];

  try {
    // Alternative 1: Upper/Lower Split (3+ days/week)
    if (frequency >= 3) {
      const upperLowerWorkoutDays = assignExercisesToDays(
        allExercises,
        [
          ["chest", "front_delts", "lats", "upper_back", "rear_delts", "triceps", "biceps"],
          ["quadriceps", "glutes", "hamstrings"],
          ["chest", "front_delts", "lats", "upper_back", "rear_delts", "triceps", "biceps"],
          ["quadriceps", "glutes", "hamstrings"],
        ].slice(0, frequency),
        4,
        "Upper/Lower"
      );

      alternatives.push({
        id: generatePlanId(),
        name: "Upper/Lower Split",
        splitType: "BRO_SPLIT",
        description: `${frequency} days per week - Upper and lower body days. Each muscle group trained 2x per week for optimal growth.`,
        workoutDays: upperLowerWorkoutDays,
        createdAt: new Date().toISOString(),
      });
    }

    // Alternative 2: Push/Pull/Legs (3+ days/week, pain-free users)
    const isPainMinimal = painProfile.painStatus === "Never" || painProfile.painStatus === "In the past";
    if (frequency >= 3 && isPainMinimal) {
      const pplMuscleGroups = [
        ["chest", "front_delts", "triceps"], // Push
        ["lats", "upper_back", "rear_delts", "biceps"], // Pull
        ["quadriceps", "glutes", "hamstrings"], // Legs
      ];

      const pplWorkoutDays = assignExercisesToDays(
        allExercises,
        pplMuscleGroups,
        4,
        "Push/Pull/Legs"
      );

      alternatives.push({
        id: generatePlanId(),
        name: "Push/Pull/Legs",
        splitType: "PPL",
        description: "Classic 3-6 day split - Push, Pull, Legs rotation. Excellent for volume and specialization.",
        workoutDays: pplWorkoutDays,
        createdAt: new Date().toISOString(),
      });
    }

    // Alternative 3: Bro Split - 5-day body-part split (5+ days/week ONLY)
    if (frequency >= 5) {
      const broSplitMuscleGroups = [
        ["chest", "front_delts"], // Chest day
        ["lats", "upper_back", "rear_delts"], // Back day
        ["front_delts", "rear_delts"], // Shoulders day
        ["biceps", "triceps"], // Arms day
        ["quadriceps", "glutes", "hamstrings"], // Legs day
      ];

      const broSplitWorkoutDays = assignExercisesToDays(
        allExercises,
        broSplitMuscleGroups,
        3,
        "Full Body"
      );

      alternatives.push({
        id: generatePlanId(),
        name: "Bro Split",
        splitType: "FRESH_MUSCLES",
        description: "5 days per week - One muscle group per day. Classic bodybuilding approach for maximum pump.",
        workoutDays: broSplitWorkoutDays,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.warn("[generateAlternativeSplits] Error generating alternatives:", error);
    // Return empty array if alternative generation fails; primary plan is always valid
  }

  return alternatives;
}

/**
 * Generate alternative splits on-demand for an existing plan
 * Uses the same filtering as the primary plan to ensure exercises are safe
 */
export function generateAlternativeSplitsForPlan(
  plan: GeneratedPlan,
  allExercises: Exercise[]
): AlternativeSplit[] {
  // Extract pain profile from plan's source onboarding
  const painProfile = extractPainProfileFromSource(plan.sourceOnboarding || null);

  const workoutsPerWeek = parseWorkoutsPerWeek(plan.settings.workoutsPerWeek);

  // Filter exercises same way as primary plan
  const filterCriteria: FilterCriteria = {
    availableEquipment: [], // TODO: Store and retrieve from plan
    painProfile,
    experience: plan.settings.experience as "Beginner" | "Intermediate" | "Advanced",
    goal: plan.settings.goal,
  };

  const filteredExercises = filterExercisesByProfile(allExercises, filterCriteria);

  console.log("[generateAlternativeSplitsForPlan] Filtered exercises:", filteredExercises.length);

  return generateAlternativeSplits(filteredExercises, painProfile, workoutsPerWeek);
}

/**
 * Main function to generate a complete training plan
 */
export function generateTrainingPlan(
  allExercises: Exercise[],
  planSettings: PlanSettings,
  quizAnswers: QuizAnswers | null,
  availableEquipment: string[],
  workoutHistory: FinishedWorkoutSummary[] = []
): GeneratedPlan {

  // Override plan settings with quiz answers if available
  const effectivePlanSettings = quizAnswers
    ? mergePlanSettingsWithQuizAnswers(planSettings, quizAnswers)
    : planSettings;

  // 1. Extract pain profile from quiz answers
  const painProfile = extractPainProfile(quizAnswers);

  // 2. Create filter criteria
  const filterCriteria: FilterCriteria = {
    availableEquipment,
    painProfile,
    experience: effectivePlanSettings.experience as "Beginner" | "Intermediate" | "Advanced",
    goal: effectivePlanSettings.goal,
  };

  // 3. Filter exercises based on user profile
  let filteredExercises = filterExercisesByProfile(allExercises, filterCriteria);
  console.log("=== PLAN GENERATION DEBUG ===");
  console.log("Total exercises in database:", allExercises.length);
  console.log("Filtered exercises count:", filteredExercises.length);
  console.log("Available equipment:", availableEquipment);
  console.log("Filter criteria:", filterCriteria);
  console.log("Filtered exercise names:", filteredExercises.slice(0, 10).map(e => `${e.name} (${e.muscle_groups.join(", ")})`));
  console.log("Pain profile:", painProfile);

  // 4. Apply progressive overload based on workout history
  if (workoutHistory.length > 0) {
    filteredExercises = applyProgressionToExercises(filteredExercises, workoutHistory);
  }

  // 5. Calculate volume recommendations
  const volumeRecommendation = calculateVolume({
    workoutDuration: effectivePlanSettings.duration,
    experience: effectivePlanSettings.experience as "Beginner" | "Intermediate" | "Advanced",
    goal: effectivePlanSettings.goal,
    painLevel: painProfile.painLevel,
  });

  // 6. Calculate how many exercises per workout
  const rawExercisesPerWorkout = calculateExercisesPerWorkout(
    volumeRecommendation.totalSetsPerWorkout,
    volumeRecommendation.setsPerExercise
  );

  // Ensure enough slots to cover all major muscle groups on Full Body days
  const exercisesPerWorkout = Math.min(Math.max(rawExercisesPerWorkout, 4), 6);

  // 7. Parse workouts per week from plan settings
  const workoutsPerWeek = parseWorkoutsPerWeek(effectivePlanSettings.workoutsPerWeek);

  // 8. Create weekly schedule structure
  createWeeklySchedule(
    effectivePlanSettings.trainingSplit,
    workoutsPerWeek
  );

  // 9. Map training split to muscle groups per day
  const muscleGroupsByDay = mapSplitToMuscleGroups(
    effectivePlanSettings.trainingSplit,
    workoutsPerWeek
  );

  // 10. Assign exercises to workout days
  const workoutDays = assignExercisesToDays(
    filteredExercises,
    muscleGroupsByDay,
    exercisesPerWorkout,
    effectivePlanSettings.trainingSplit
  );

  // 10.1. Restructure 3-day Full Body splits with rotating focus (Push/Lower/Pull)
  // Pass allExercises so it can access unfiltered pulls for Day C
  const rotatedWorkoutDays = restructureThreeDayFullBody(
    workoutDays,
    effectivePlanSettings.trainingSplit,
    workoutsPerWeek,
    allExercises
  );

  // For Upper/Lower 4-day splits, cap lower-day exercises to reduce weekly leg/glute volume
  const lowerBodyGroups = new Set(["quadriceps", "glutes", "hamstrings"]);
  // 10.2. Rebalance upper/lower days for back-safe programming
  const adjustedWorkoutDays = rotatedWorkoutDays.map((day) => {
    const isLowerDay =
      effectivePlanSettings.trainingSplit === "Upper/Lower" &&
      day.muscleGroups.length > 0 &&
      day.muscleGroups.every((mg) => lowerBodyGroups.has(mg));

    if (isLowerDay && exercisesPerWorkout > 3) {
      // Limit to top 3 selections to keep weekly leg/glute sets in target range
      return { ...day, exercises: day.exercises.slice(0, 3) };
    }

    return day;
  });

  // 10.3. Apply professional coaching rules for balance and safety (Upper/Lower specific)
  const rebalancedWorkoutDays = rebalanceUpperLowerDays(
    adjustedWorkoutDays,
    filteredExercises,
    effectivePlanSettings.trainingSplit,
    painProfile
  );
  console.log("Muscle groups by day:", muscleGroupsByDay);
  console.log("Exercises per workout:", exercisesPerWorkout);
  console.log("Filtered exercises before assignment:", filteredExercises.length);
  console.log("Workout days after assignment:", workoutDays.map(d => ({
    day: d.dayName,
    exerciseCount: d.exercises.length,
    muscleGroups: d.muscleGroups
  })));
  if (workoutDays.length > 0 && workoutDays[0].exercises.length === 0) {
    console.error("❌ ERROR: No exercises assigned to any day!");
    console.log("First day exercises:", workoutDays[0].exercises);
  }

  // 11. Apply sets/reps to adjusted days to keep consistency
  // 10.4. Apply progression guardrails for back users before setting volume
  const guardedWorkoutDays = applyProgressionGuardrails(
    rebalancedWorkoutDays,
    painProfile
  );

  const pullBalancedWorkoutDays = enforcePullNotLessThanPush(
    guardedWorkoutDays,
    filteredExercises
  );

  // Ensure at least one vertical pull per week for shoulder health
  // Pass UNFILTERED allExercises so we can find vertical pulls even if they were filtered out
  const verticalPullBalancedDays = ensureWeeklyVerticalPull(
    pullBalancedWorkoutDays,
    allExercises
  );

  // Reduce repeated Seated Cable Row across all days by swapping one occurrence
  const variabilityAdjustedDays = enforceRowVariability(
    verticalPullBalancedDays,
    filteredExercises
  );

  // Ensure at least one light rear-delt exercise per week for shoulder health
  const rearDeltBalancedDays = ensureRearDeltWork(
    variabilityAdjustedDays,
    filteredExercises
  );

  // Build sourceOnboarding to get split information
  const sourceOnboarding = buildSourceOnboarding(quizAnswers, effectivePlanSettings);

  // Enforce FULL_BODY_AB split requirements (Day A needs push + horizontal pull, Day B needs push + vertical pull)
  const fullBodyABEnforcedDays = sourceOnboarding?.split
    ? enforceFullBodyABRequirements(rearDeltBalancedDays, allExercises, sourceOnboarding.split)
    : rearDeltBalancedDays;

  // 12. Apply volume (sets/reps) to final workout days
  const adjustedWorkoutDaysWithVolume = fullBodyABEnforcedDays.map((day) => ({
    ...day,
    exercises: day.exercises.map((exercise) => {
      // Core stability exercises should not have weight assigned
      if (isCoreStability(exercise)) {
        return {
          ...exercise,
          sets: volumeRecommendation.setsPerExercise,
          reps: volumeRecommendation.repsPerSet,
          weight: 0,
          weight_unit: "bodyweight",
          load_mode: undefined,
        };
      }

      // Preserve rear-delt exercise volume if already set (light weight, higher reps)
      if (isRearDeltExercise(exercise) && exercise.sets && exercise.reps) {
        return exercise; // Keep existing volume parameters
      }

      return {
        ...exercise,
        sets: volumeRecommendation.setsPerExercise,
        reps: volumeRecommendation.repsPerSet,
      };
    }),
  }));

  // 13. Check for missing muscle groups
  const allTargetMuscleGroups = muscleGroupsByDay.flat();
  const missingMuscleGroups = getMissingMuscleGroups(
    allTargetMuscleGroups,
    filteredExercises
  );

  // 14. Get alternative exercises for missing muscle groups
  const alternativeExercises = missingMuscleGroups.length > 0
    ? getAlternativeExercises(allExercises, missingMuscleGroups)
    : [];

  // 15. Generate plan metadata
  const planId = generatePlanId();
  const planName = generatePlanName(effectivePlanSettings);

  // Determine the plan's split type from sourceOnboarding
  const primarySplitType: "FULL_BODY_ABC" | "FULL_BODY_AB" | "FULL_BODY_4X" | "UPPER_LOWER_4X" | "UPPER_LOWER_UPPER" | "UPPER_LOWER_STRENGTH_HYPERTROPHY" | "PUSH_PULL_LEGS" | "PPL" | "BRO_SPLIT" | "FRESH_MUSCLES" =
    sourceOnboarding?.split?.type || "FULL_BODY_AB"; // Use split type from sourceOnboarding, fallback to FULL_BODY_AB

  // 15. Return primary plan (alternatives stored separately)
  return {
    id: planId,
    name: planName,
    splitType: primarySplitType,
    createdAt: new Date().toISOString(),
    settings: effectivePlanSettings,
    sourceOnboarding,
    workoutDays: adjustedWorkoutDaysWithVolume,
    missingMuscleGroups,
    alternativeExercises,
  };
}

/**
 * Balance Upper/Lower days with back-safe coaching rules
 * - Upper days: if pressing ≥ 2, ensure ≥ 2 pulls; add vertical/diagonal pull when missing
 * - Replace dips with vertical pull (preferred) or rope pressdown when already balanced
 * - Lower days: ensure a knee-flexion hamstring exercise is present (e.g., Lying Leg Curl)
 * - Add a spine-hygiene core pattern once if absent across the week (Bird Dog)
 */
function rebalanceUpperLowerDays(
  days: WorkoutDay[],
  allExercises: Exercise[],
  trainingSplit: PlanSettings["trainingSplit"],
  painProfile: PainProfile
): WorkoutDay[] {
  if (trainingSplit !== "Upper/Lower") return days;

  const isUpperGroup = (mg: string) =>
    [
      "chest",
      "lats",
      "upper_back",
      "front_delts",
      "rear_delts",
      "triceps",
      "biceps",
    ].includes(mg);

  const isLowerGroupSet = (mgs: string[]) => {
    const lowerSet = new Set(["quadriceps", "glutes", "hamstrings"]);
    return mgs.length > 0 && mgs.every((m) => lowerSet.has(m));
  };
  const isCore = (e: Exercise) => (e as any).category === "core";

  const verticalOrDiagonalPull =
    findExerciseByName(allExercises, "Lat Pulldown (Neutral Grip)") ||
    findExerciseByName(allExercises, "One-Arm Crossover Cable Pull");
  const horizontalPull = findExerciseByName(allExercises, "Seated Cable Row");
  const facePull =
    findExerciseByName(allExercises, "Cable Face Pull") ||
    findExerciseByName(allExercises, "Reverse Pec Deck (Rear-Delt Fly)");
  const ropePressdown = findExerciseByName(allExercises, "Cable Tricep Pushdown");
  const hamstringCurl =
    findExerciseByName(allExercises, "Lying Leg Curl") ||
    findExerciseByName(allExercises, "Seated Leg Curl");
  const spineCore = findExerciseByName(
    allExercises,
    "Bird Dog (Bench or Stability Ball)"
  );

  // Track if core is added at least once across the week
  let coreAdded = days.some((d) => d.exercises.some((e) => isCore(e)));

  const updated = days.map((day) => {
    const isUpperDay = day.muscleGroups.some((mg) => isUpperGroup(mg)) && !isLowerGroupSet(day.muscleGroups);
    const isLowerDay = isLowerGroupSet(day.muscleGroups);

    let exercises = day.exercises.slice();

    if (isUpperDay) {
      const pressCount = exercises.filter(isPress).length;
      const pullCount = exercises.filter(isPull).length;
      const hasAnyVertical = exercises.some(hasVerticalPull);
      const verticalPullCount = exercises.filter(hasVerticalPull).length;

      // Rule: per Upper day → minPull = 2 movements if pressing ≥2
      // BUT: limit to 1 vertical pull max per upper day (balance: 1 vertical + 1 horizontal per day)
      if (pressCount >= 2 && pullCount < 2 && verticalPullCount === 0) {
        exercises = preferAddIfNotPresent(exercises, verticalOrDiagonalPull);
      }

      // Upper day must include: horizontal_pull:1 and vertical_pull:1 (max 1 vertical)
      const hasHorizontal = exercises.some((e) => (e.name || "").toLowerCase().includes("row"));
      if (!hasHorizontal) {
        exercises = preferAddIfNotPresent(exercises, horizontalPull);
      }

      // CRITICAL: Limit to EXACTLY 1 vertical pull per upper day
      // If more than 1 vertical, remove the secondary vertical pull
      if (verticalPullCount > 1) {
        // Keep first vertical, remove others
        let removedCount = 0;
        exercises = exercises.filter((e) => {
          if (hasVerticalPull(e) && removedCount > 0) {
            removedCount++;
            return false; // Remove this vertical pull
          }
          if (hasVerticalPull(e)) {
            removedCount++;
          }
          return true;
        });
      }

      // CRITICAL: Every upper day MUST have a vertical pull
      // If missing, replace chest or arm isolation
      const hasVertical = exercises.some(hasVerticalPull);
      if (!hasVertical) {
        const preferredVertical =
          findExerciseByName(allExercises, "Lat Pulldown (Neutral Grip)") ||
          facePull ||
          verticalOrDiagonalPull;

        if (preferredVertical) {
          // Try to replace chest fly first
          const flyIdx = exercises.findIndex((e) => (e.name || "").toLowerCase().includes("fly"));
          if (flyIdx !== -1) {
            exercises[flyIdx] = preferredVertical;
          } else {
            // Try to replace an arm isolation (kickback, curl, or isolation triceps)
            const armIsoIdx = exercises.findIndex((e) => {
              const name = (e.name || "").toLowerCase();
              return name.includes("kickback") ||
                name.includes("curl") && !name.includes("leg") ||
                (name.includes("tricep") && !name.includes("press"));
            });
            if (armIsoIdx !== -1) {
              exercises[armIsoIdx] = preferredVertical;
            } else {
              // Last resort: just add it
              exercises = preferAddIfNotPresent(exercises, preferredVertical);
            }
          }
        }
      }

      // Replace dips with vertical pull first if weekly has no vertical pull yet
      const hasDips = exercises.some(
        (e) => (e.name || "").toLowerCase().includes("dips")
      );
      if (hasDips) {
        if (!hasAnyVertical) {
          // Replace with vertical/diagonal pull; if it already exists, fall back to rope pressdown
          const candidate = verticalOrDiagonalPull;
          const alreadyHasCandidate = candidate
            ? exercises.some((e) => e.id === candidate.id)
            : false;
          exercises = alreadyHasCandidate
            ? replaceByName(exercises, "Assisted Dips", ropePressdown)
            : replaceByName(exercises, "Assisted Dips", candidate);
        } else {
          exercises = replaceByName(exercises, "Assisted Dips", ropePressdown);
        }
      }

      // If unilateral cable pull exists and lat pulldown is available, prefer pulldown over unilateral row
      const unilateralIdx = exercises.findIndex((e) =>
        (e.name || "").toLowerCase().includes("crossover cable pull") ||
        (e.name || "").toLowerCase().includes("one-arm")
      );
      const latPreferred = findExerciseByName(
        allExercises,
        "Lat Pulldown (Neutral Grip)"
      );
      if (unilateralIdx !== -1 && latPreferred) {
        const duplicateLat = exercises.some((e) => e.id === latPreferred.id);
        if (!duplicateLat) {
          const clone = exercises.slice();
          clone[unilateralIdx] = latPreferred;
          exercises = clone;
        }
      }

      // Optionally add a spine-hygiene core on one upper day if not added yet
      if (!coreAdded && spineCore) {
        exercises = preferAddIfNotPresent(exercises, spineCore);
        coreAdded = true;
      }
    }

    if (isLowerDay) {
      const hasHamstringCurl = exercises.some(
        (e) =>
          (e.name || "").toLowerCase().includes("leg curl") ||
          ((e.muscle_groups || []).includes("hamstrings") &&
            (e.name || "").toLowerCase().includes("curl"))
      );
      if (!hasHamstringCurl && hamstringCurl) {
        exercises = preferAddIfNotPresent(exercises, hamstringCurl);
      }
    }

    const deduped = dedupeExercises(exercises);

    return { ...day, exercises: deduped };
  });

  // Weekly safeguard: for users with back history, ensure weekly_pull_sets >= weekly_push_sets
  const userHasBackHistory = painProfile.painStatus && painProfile.painStatus !== "Never";
  if (userHasBackHistory) {
    const countWeekly = (predicate: (e: Exercise) => boolean) =>
      updated.reduce((acc, d) => acc + d.exercises.filter(predicate).length, 0);
    const weeklyPress = countWeekly(isPress);
    const weeklyPull = countWeekly(isPull);
    if (weeklyPress > weeklyPull) {
      // Replace a non-essential press isolation with a pull candidate
      const pullCandidate =
        findExerciseByName(allExercises, "Lat Pulldown (Neutral Grip)") ||
        horizontalPull ||
        verticalOrDiagonalPull;
      for (let di = 0; di < updated.length; di++) {
        const day = updated[di];
        const isUpperDay = day.muscleGroups.some((mg) => isUpperGroup(mg)) && !isLowerGroupSet(day.muscleGroups);
        if (!isUpperDay) continue;
        const idxFly = day.exercises.findIndex((e) => (e.name || "").toLowerCase().includes("fly"));
        if (idxFly !== -1 && pullCandidate) {
          const exists = day.exercises.some((e) => e.id === pullCandidate.id);
          const clone = day.exercises.slice();
          clone[idxFly] = exists ? clone[idxFly] : pullCandidate;
          // De-duplicate again
          const deduped = dedupeExercises(clone);
          updated[di] = { ...day, exercises: deduped };
          break;
        }
      }
    }
  }

  return updated;
}

/**
 * Global pull-priority safeguard for shoulder health
 * Ensures weekly pull movements are always >= push movements across any split
 * Prioritizes vertical pulls first for lat/posture development
 */
function enforcePullNotLessThanPush(
  days: WorkoutDay[],
  allExercises: Exercise[]
): WorkoutDay[] {
  // Prioritize vertical pulls first, then horizontal
  const pullCandidates = [
    "Lat Pulldown (Neutral Grip)",
    "Pull-Up",
    "Chin-Up",
    "Seated Cable Row",
    "Chest Supported Row",
    "Cable Face Pull",
    "Reverse Pec Deck (Rear-Delt Fly)",
  ]
    .map((name) => findExerciseByName(allExercises, name))
    .filter(Boolean) as Exercise[];

  if (pullCandidates.length === 0) return days;

  const pickCandidate = (existing: Exercise[]): Exercise | undefined => {
    for (const cand of pullCandidates) {
      const exists = existing.some((e) => e.id === cand.id);
      if (!exists) return cand;
    }
    return pullCandidates[0];
  };

  const countTotals = (current: WorkoutDay[]) => {
    const press = current.reduce(
      (acc, d) => acc + d.exercises.filter(isPress).length,
      0
    );
    const pull = current.reduce(
      (acc, d) => acc + d.exercises.filter(isPull).length,
      0
    );
    return { press, pull };
  };

  const updated = days.map((d) => ({ ...d, exercises: d.exercises.slice() }));
  let { press, pull } = countTotals(updated);
  if (press <= pull) return updated;

  const pullsByDay = (day: WorkoutDay) => day.exercises.filter(isPull).length;

  let iteration = 0;
  const maxIterations = 20;

  while (press > pull && iteration < maxIterations) {
    let added = false;

    const dayOrder = updated
      .map((d, i) => ({ i, pulls: pullsByDay(d) }))
      .sort((a, b) => a.pulls - b.pulls);

    for (const { i } of dayOrder) {
      const candidate = pickCandidate(updated[i].exercises);
      if (!candidate) continue;

      const nextExercises = preferAddIfNotPresent(updated[i].exercises, candidate);
      if (nextExercises !== updated[i].exercises) {
        updated[i] = { ...updated[i], exercises: dedupeExercises(nextExercises) };
        added = true;
        break;
      }
    }

    ({ press, pull } = countTotals(updated));
    if (!added) break;
    iteration++;
  }

  return updated;
}

/**
 * Ensure at least one vertical pull per week for shoulder health + lats + posture
 * Critical for desk workers and overall shoulder balance
 */
function ensureWeeklyVerticalPull(
  days: WorkoutDay[],
  allExercises: Exercise[]
): WorkoutDay[] {
  // Check if any vertical pull exists in the weekly plan
  const hasVertical = days.some((d) =>
    d.exercises.some((e) => hasVerticalPull(e))
  );

  if (hasVertical) return days;

  // Find vertical pull candidates (prioritize true vertical pulls)
  let verticalPullCandidates = [
    "Lat Pulldown (Neutral Grip)",
    "Lat Pulldown (Wide Grip)",
    "Pull-Up",
    "Chin-Up",
    "Straight-Arm Pulldown",
    "Assisted Pull-Up",
  ]
    .map((name) => findExerciseByName(allExercises, name))
    .filter(Boolean) as Exercise[];

  // Fallback: if no named candidates, find any exercise with vertical pull characteristics
  if (verticalPullCandidates.length === 0) {
    verticalPullCandidates = allExercises.filter(e => hasVerticalPull(e));
  }

  if (verticalPullCandidates.length === 0) return days;

  const verticalCandidate = verticalPullCandidates[0];

  // Find the best day to add vertical pull:
  // 1. Prefer upper body days
  // 2. Or day with the most pull exercises
  // 3. Or first day with exercises
  const upperBodyGroups = new Set([
    "chest",
    "lats",
    "upper_back",
    "front_delts",
    "rear_delts",
    "triceps",
    "biceps",
  ]);

  let targetDayIndex = -1;

  // Prefer Day C (Pull Focus) for 3-day Full Body splits
  if (days.length === 3) {
    const dayCIndex = days.findIndex((d) =>
      (d.dayName || "").toLowerCase().includes("pull focus") ||
      (d.dayName || "").toLowerCase().includes("day c")
    );
    if (dayCIndex !== -1 && days[dayCIndex].exercises.length > 0) {
      targetDayIndex = dayCIndex;
    }
  }

  // Next: find an upper body day
  if (targetDayIndex === -1) {
    for (let i = 0; i < days.length; i++) {
      const isUpperDay = days[i].muscleGroups.some((mg) => upperBodyGroups.has(mg));
      if (isUpperDay && days[i].exercises.length > 0) {
        targetDayIndex = i;
        break;
      }
    }
  }

  // Next: day with most pulls
  if (targetDayIndex === -1) {
    let maxPulls = 0;
    for (let i = 0; i < days.length; i++) {
      const pullCount = days[i].exercises.filter(isPull).length;
      if (pullCount > maxPulls && days[i].exercises.length > 0) {
        maxPulls = pullCount;
        targetDayIndex = i;
      }
    }
  }

  // Fallback: first day with exercises
  if (targetDayIndex === -1) {
    targetDayIndex = days.findIndex((d) => d.exercises.length > 0);
  }

  if (targetDayIndex === -1) return days;

  const targetDay = days[targetDayIndex];
  const hasVerticalOnTargetDay = targetDay.exercises.some((e) => hasVerticalPull(e));

  // If vertical pull already exists on target day, return as-is
  if (hasVerticalOnTargetDay) return days;

  // Try to replace a horizontal pull first
  const horizontalPullIdx = targetDay.exercises.findIndex((e) => {
    const name = (e.name || "").toLowerCase();
    return (
      isPull(e) &&
      !hasVerticalPull(e) &&
      (name.includes("row") || name.includes("cable pull"))
    );
  });

  const updated = days.map((d) => ({ ...d, exercises: d.exercises.slice() }));

  if (horizontalPullIdx !== -1) {
    // Replace horizontal pull with vertical pull
    updated[targetDayIndex].exercises[horizontalPullIdx] = verticalCandidate;
  } else {
    // Also try to replace diagonal/unilateral pulls that aren't true vertical (crossover, one-arm)
    const diagonalPullIdx = targetDay.exercises.findIndex((e) => {
      const name = (e.name || "").toLowerCase();
      return isPull(e) && !hasVerticalPull(e) && (name.includes("crossover") || name.includes("one-arm"));
    });
    if (diagonalPullIdx !== -1) {
      updated[targetDayIndex].exercises[diagonalPullIdx] = verticalCandidate;
    } else {
      // Try to replace non-critical exercise (chest fly, isolation, light accessory)
      const nonCriticalIdx = targetDay.exercises.findIndex((e) => {
        const name = (e.name || "").toLowerCase();
        return (
          name.includes("fly") ||
          name.includes("kickback") ||
          name.includes("isolation") ||
          name.includes("curl") ||
          (isCoreStability(e) && targetDay.exercises.filter(isCoreStability).length > 1)
        );
      });
      if (nonCriticalIdx !== -1) {
        updated[targetDayIndex].exercises[nonCriticalIdx] = verticalCandidate;
      } else {
        // Last resort: add as new exercise
        updated[targetDayIndex].exercises = preferAddIfNotPresent(
          updated[targetDayIndex].exercises,
          verticalCandidate
        );
      }
    }
  }

  // Deduplicate
  updated[targetDayIndex].exercises = dedupeExercises(
    updated[targetDayIndex].exercises
  );

  return updated;
}

/**
 * Ensure at least one light rear-delt/external rotation exercise per week
 * Critical for shoulder health, posture, and injury prevention
 */
function ensureRearDeltWork(
  days: WorkoutDay[],
  allExercises: Exercise[]
): WorkoutDay[] {
  // Check if any rear-delt exercise exists
  const hasRearDelt = days.some((d) =>
    d.exercises.some((e) => isRearDeltExercise(e))
  );

  if (hasRearDelt) return days;

  // Find rear-delt candidates
  const rearDeltCandidates = [
    "Cable Face Pull",
    "Reverse Pec Deck (Rear-Delt Fly)",
    "Band Pull Apart",
  ]
    .map((name) => findExerciseByName(allExercises, name))
    .filter(Boolean) as Exercise[];

  if (rearDeltCandidates.length === 0) return days;

  const rearDeltCandidate = rearDeltCandidates[0];

  // Find the best day to add rear-delt work:
  // Prefer upper body days (Upper A or B in Upper/Lower split)
  const upperBodyGroups = new Set([
    "chest",
    "lats",
    "upper_back",
    "front_delts",
    "rear_delts",
    "triceps",
    "biceps",
  ]);

  let targetDayIndex = -1;

  // Find an upper body day with exercises
  for (let i = 0; i < days.length; i++) {
    const isUpperDay = days[i].muscleGroups.some((mg) =>
      upperBodyGroups.has(mg)
    );
    if (isUpperDay && days[i].exercises.length > 0) {
      targetDayIndex = i;
      break;
    }
  }

  // Fallback: any day with exercises
  if (targetDayIndex === -1) {
    targetDayIndex = days.findIndex((d) => d.exercises.length > 0);
  }

  if (targetDayIndex === -1) return days;

  const updated = days.map((d) => ({ ...d, exercises: d.exercises.slice() }));

  // Add rear-delt exercise with specific volume parameters (2-3 sets × 12-15 reps, light)
  const rearDeltWithVolume = {
    ...rearDeltCandidate,
    sets: 3,
    reps: 15,
    weight: rearDeltCandidate.weight ? Math.round(rearDeltCandidate.weight * 0.5) : 5, // Light weight (50% of default or 5kg)
    weight_unit: "kg",
  };

  updated[targetDayIndex].exercises = [
    ...updated[targetDayIndex].exercises,
    rearDeltWithVolume,
  ];

  // Deduplicate
  updated[targetDayIndex].exercises = dedupeExercises(
    updated[targetDayIndex].exercises
  );

  return updated;
}

/**
 * Enforce variability in horizontal pulls: avoid repeating Seated Cable Row on all days
 * Swaps one duplicate with a back-friendly alternative if available
 */
function enforceRowVariability(
  days: WorkoutDay[],
  allExercises: Exercise[]
): WorkoutDay[] {
  const nameIncludes = (e: Exercise, s: string) => (e.name || "").toLowerCase().includes(s);

  // Count occurrences of Seated Cable Row
  const occurrences: Array<{ dayIndex: number; exIndex: number }> = [];
  days.forEach((d, di) => {
    d.exercises.forEach((e, ei) => {
      if (nameIncludes(e, "seated cable row")) {
        occurrences.push({ dayIndex: di, exIndex: ei });
      }
    });
  });

  if (occurrences.length <= 2) return days; // Allow up to 2 times per week

  // Find alternatives
  const alternatives = [
    "Chest Supported Row",
    "Seated Row (Chest Supported)",
    "One-Arm Crossover Cable Pull",
    "Straight-Arm Pulldown",
  ]
    .map((n) => findExerciseByName(allExercises, n))
    .filter(Boolean) as Exercise[];

  if (alternatives.length === 0) return days;

  // Replace the last occurrence to reduce repetition
  const target = occurrences[occurrences.length - 1];
  const replacement = alternatives[0];
  const updated = days.map((d) => ({ ...d, exercises: d.exercises.slice() }));
  updated[target.dayIndex].exercises[target.exIndex] = replacement;

  // Deduplicate and return
  updated[target.dayIndex].exercises = dedupeExercises(updated[target.dayIndex].exercises);
  return updated;
}

/**
 * Restructure 3-day Full Body split with rotating daily focus
 * Applies to both:
 * - FULL_BODY_ABC (Beginner): Full Body A/B/C rotation
 * - UPPER_LOWER_UPPER (Intermediate): Upper/Lower/Upper split
 * 
 * Day A: Push Focus (chest, shoulders, triceps + legs)
 * Day B: Lower Focus (legs, glutes, hamstrings + upper back)
 * Day C: Pull Focus (lats, back, biceps + legs)
 */
function restructureThreeDayFullBody(
  days: WorkoutDay[],
  trainingSplit: PlanSettings["trainingSplit"],
  workoutsPerWeek: number,
  allExercises: Exercise[] = []
): WorkoutDay[] {
  // Apply to 3-day Full Body OR 3-day Upper/Lower splits
  const isThreeDaySplit = workoutsPerWeek === 3 && days.length === 3 &&
    (trainingSplit === "Full Body" || trainingSplit === "Upper/Lower");

  if (!isThreeDaySplit) {
    return days;
  }

  // Categorize all available exercises from both current plan and database
  const categorizeExercise = (e: Exercise) => {
    const muscleGroups = e.muscle_groups || [];
    const name = (e.name || "").toLowerCase();

    return {
      isPush: isPress(e),
      isPull: isPull(e),
      isVerticalPull: hasVerticalPull(e),
      isLeg: muscleGroups.some(mg => ["quadriceps", "glutes", "hamstrings"].includes(mg)),
      isCore: isCoreStability(e),
      isRearDelt: isRearDeltExercise(e),
      isHinge: name.includes("deadlift") || name.includes("rdl") || name.includes("hip thrust"),
      isQuad: muscleGroups.includes("quadriceps"),
      isHamstring: muscleGroups.includes("hamstrings"),
    };
  };

  // Collect all exercises from all days + unfiltered database
  const allDayExercises = days.flatMap(d => d.exercises);
  const allPossibleExercises = [...allDayExercises, ...allExercises];
  const categorized = allPossibleExercises.map(e => ({
    exercise: e,
    ...categorizeExercise(e),
  }));

  // Split exercises by category (now including unfiltered pulls for Day C)
  const pushExercises = categorized.filter(c => c.isPush && !c.isLeg).map(c => c.exercise);
  const pullExercises = categorized.filter(c => c.isPull && !c.isLeg).map(c => c.exercise);
  const verticalPulls = categorized.filter(c => c.isVerticalPull).map(c => c.exercise);
  const horizontalPulls = pullExercises.filter(p => !verticalPulls.some(v => v.id === p.id));
  const legExercises = categorized.filter(c => c.isLeg).map(c => c.exercise);
  const hingeExercises = categorized.filter(c => c.isHinge).map(c => c.exercise);
  const quadExercises = categorized.filter(c => c.isQuad && !c.isHinge).map(c => c.exercise);
  const hamstringExercises = categorized.filter(c => c.isHamstring).map(c => c.exercise);
  const coreExercises = categorized.filter(c => c.isCore).map(c => c.exercise);
  const rearDeltExercises = categorized.filter(c => c.isRearDelt).map(c => c.exercise);

  // DAY A: Push Focus (chest, shoulders, triceps + 1 leg compound + 1 horizontal pull)
  const dayAExercises = [
    ...pushExercises.slice(0, 2),
    ...(quadExercises.length > 0 ? [quadExercises[0]] : legExercises.slice(0, 1)),
    ...(horizontalPulls.length > 0 ? [horizontalPulls[0]] : pullExercises.slice(0, 1)),
    ...(coreExercises.length > 0 ? [coreExercises[0]] : []),
  ].filter(Boolean);

  // DAY B: Lower Focus (hinge, quad, hamstring only - NO upper body exercises)
  const dayBExercises = [
    ...(hingeExercises.length > 0 ? [hingeExercises[0]] : legExercises.slice(0, 1)),
    ...(quadExercises.length > 1 ? [quadExercises[1]] : []),
    ...(hamstringExercises.length > 0 ? [hamstringExercises[0]] : []),
  ].filter(Boolean);

  // DAY C: Pull Focus - MUST include vertical pull, exclude ANY push exercises
  // Prioritize: true vertical pull from database > vertical pulls from current plan > any other pull
  let dayCVerticalPull: Exercise | undefined = verticalPulls[0];

  // If no vertical pull found in plan, look for one explicitly in unfiltered database
  if (!dayCVerticalPull) {
    dayCVerticalPull = [
      "Lat Pulldown (Neutral Grip)",
      "Lat Pulldown (Wide Grip)",
      "Pull-Up",
      "Chin-Up",
      "Straight-Arm Pulldown",
      "Assisted Pull-Up",
    ]
      .map((name) => findExerciseByName(allExercises, name))
      .find((ex) => ex !== undefined);
  }

  const dayCHorizontalPull: Exercise | undefined = horizontalPulls.find(
    (p) => !dayAExercises.includes(p) && !dayBExercises.includes(p)
  ) || horizontalPulls[2] || horizontalPulls[0];

  const dayCExercises = [
    dayCVerticalPull,
    dayCHorizontalPull,
    ...(hamstringExercises.length > 1 ? [hamstringExercises[1]] : legExercises.slice(1, 2)),
    ...(rearDeltExercises.length > 0 ? [rearDeltExercises[0]] : []),
  ].filter((e) => e && !isPress(e)) as Exercise[];

  // Ensure each day has 4-6 exercises, prioritize adding vertical to Day C if missing
  const ensureMinExercises = (exercises: Exercise[], min: number, dayIndex: number) => {
    if (exercises.length >= min) return exercises.slice(0, 6);

    if (dayIndex === 2 && !exercises.some(e => hasVerticalPull(e))) {
      const availableVertical = verticalPulls.find(v => !exercises.some(e => e.id === v.id));
      if (availableVertical) {
        exercises = [...exercises, availableVertical];
      }
    }

    if (exercises.length >= min) return exercises.slice(0, 6);

    const used = new Set(exercises.map(e => e.id));
    // For Day B (Lower Focus), filter out ALL upper body exercises when padding
    // For Day C (Pull Focus), filter out push exercises when padding
    const remaining = dayIndex === 1
      ? allDayExercises.filter(e => !used.has(e.id) && !isPress(e) && !isPull(e)) // Day B: only legs
      : dayIndex === 2
        ? allDayExercises.filter(e => !used.has(e.id) && !isPress(e)) // Day C: no push
        : allDayExercises.filter(e => !used.has(e.id)); // Day A: anything
    return [...exercises, ...remaining].slice(0, Math.max(min, 4));
  };

  const finalDayA = dedupeExercises(ensureMinExercises(dayAExercises, 4, 0));
  const finalDayB = dedupeExercises(ensureMinExercises(dayBExercises, 4, 1));
  const finalDayC = dedupeExercises(ensureMinExercises(dayCExercises, 4, 2));

  // Update day names and muscle groups with focus indicators
  return [
    {
      ...days[0],
      dayName: "Day A (Push Focus)",
      muscleGroups: ["chest", "front_delts", "triceps", "lats", "upper_back", "quadriceps", "glutes", "hamstrings"],
      exercises: finalDayA,
    },
    {
      ...days[1],
      dayName: "Day B (Lower Focus)",
      muscleGroups: ["quadriceps", "glutes", "hamstrings"],
      exercises: finalDayB,
    },
    {
      ...days[2],
      dayName: "Day C (Pull Focus)",
      muscleGroups: ["lats", "upper_back", "rear_delts", "biceps", "quadriceps", "glutes", "hamstrings"],
      exercises: finalDayC,
    },
  ];
}

/**
 * Progression guardrails for back users
 * - Limit weekly weight increase to <= 5% for back-friendly exercises under load
 * - If pain level > 3, switch progression to reps/tempo only (no weight increase)
 */
function applyProgressionGuardrails(
  days: WorkoutDay[],
  painProfile: PainProfile
): WorkoutDay[] {
  const painHigh = typeof painProfile.painLevel === "number" && painProfile.painLevel > 3;
  const adjustExercise = (ex: Exercise): Exercise => {
    const info: any = (ex as any).progressionInfo;
    if (!info) return ex;
    const last = info.lastPerformed;
    const sugg = info.suggestion;
    if (!sugg) return ex;

    // If pain is high, keep weight and bias reps/tempo only
    if (painHigh) {
      if (last && typeof last.averageWeight === "number") {
        sugg.weight = last.averageWeight; // lock weight
      } else if (typeof ex.weight === "number") {
        sugg.weight = ex.weight; // lock to current
      }
      // bias reps increase by +1 if available
      if (typeof sugg.reps === "number") {
        sugg.reps = Math.min(sugg.reps + 1, 15);
      }
      sugg.reason = "Pain reported >3: progression via reps/tempo only";
      return { ...ex, progressionInfo: { ...info, suggestion: sugg } } as Exercise;
    }

    // Otherwise cap weight increases at 5% if back-friendly and likely under load
    const isBackFriendly = (ex as any).is_back_friendly === true;
    const underLoadLikely = (ex.equipment && ex.equipment !== "bodyweight");
    if (isBackFriendly && underLoadLikely && last && typeof last.averageWeight === "number") {
      const maxAllowed = last.averageWeight * 1.05;
      if (typeof sugg.weight === "number" && sugg.weight > maxAllowed) {
        sugg.weight = Math.round(maxAllowed * 100) / 100; // clamp
        sugg.reason = "Guardrail: limit weekly weight increase to ≤5%";
        return { ...ex, progressionInfo: { ...info, suggestion: sugg } } as Exercise;
      }
    }
    return ex;
  };

  return days.map((d) => ({
    ...d,
    exercises: d.exercises.map(adjustExercise),
  }));
}

/**
 * Merge plan settings with quiz answers
 * Maps quiz answers to plan settings format
 * 
 * Quiz Answer IDs:
 * - 1.5: workoutType (not in answers, handled separately)
 * - 2: goal
 * - 3: baselineStats (multi_field: gender, dateOfBirth, height, weight)
 * - 7: bodyType
 * - 8: experience
 * - 9: trainingFrequency
 * - 10: painStatus
 * - 11: painLocation
 * - 12: painLevel (conditional)
 * - 13: painTriggers
 * - 14: canSquat
 * - 15: workoutDuration
 */
function mergePlanSettingsWithQuizAnswers(
  planSettings: PlanSettings,
  quizAnswers: QuizAnswers
): PlanSettings {
  const answers = quizAnswers.answers;

  // Map quiz answers to plan settings
  const goalAnswer = answers[2]; // question id 2: goal
  const experienceAnswer = answers[8]; // question id 8: experience
  const trainingFrequencyAnswer = answers[9]; // question id 9: trainingFrequency
  const workoutDurationAnswer = answers[15]; // question id 15: workoutDuration (was 16, now 15)

  // Goal mapping
  const goalOptions = [
    "Build muscle safely (gym-goer with back or sciatic pain)",
    "Reduce pain and improve back health",
  ];
  const goal = typeof goalAnswer === "number" ? goalOptions[goalAnswer] : planSettings.goal;

  // Experience mapping
  const experienceOptions = ["Beginner", "Intermediate", "Advanced"];
  const experience = typeof experienceAnswer === "number"
    ? experienceOptions[experienceAnswer]
    : planSettings.experience;

  // Training frequency mapping
  const frequencyOptions = ["2", "3", "4", "5+"];
  const frequencyValue = typeof trainingFrequencyAnswer === "number"
    ? frequencyOptions[trainingFrequencyAnswer]
    : "3";
  const workoutsPerWeek = `${frequencyValue.replace("+", "")} days per week`;

  // Workout duration mapping
  const durationOptions = ["10–20 min", "20–30 min", "30–45 min", "45–60 min"];
  const durationValue = typeof workoutDurationAnswer === "number"
    ? durationOptions[workoutDurationAnswer]
    : "30–45 min";

  // Map duration to plan settings format
  let duration = "1 hr";
  if (durationValue.includes("10–20")) duration = "15 min";
  else if (durationValue.includes("20–30")) duration = "25 min";
  else if (durationValue.includes("30–45")) duration = "35 min";
  else if (durationValue.includes("45–60")) duration = "50 min";
  else if (durationValue.includes("60-120")) duration = "1 hr";
  else duration = planSettings.duration;

  // Determine appropriate training split based on frequency
  let trainingSplit = planSettings.trainingSplit;
  const numWorkouts = parseInt(frequencyValue);
  if (numWorkouts <= 2) {
    trainingSplit = "Full Body";
  } else if (numWorkouts === 3) {
    trainingSplit = "Full Body"; // or "Push/Pull/Legs"
  } else if (numWorkouts === 4) {
    trainingSplit = "Upper/Lower";
  } else if (numWorkouts >= 5) {
    trainingSplit = "Push/Pull/Legs";
  }

  // Extract personal profile data from quiz
  // Question 3 is now a multi_field containing gender, dateOfBirth, height, weight
  const baselineStatsAnswer = answers[3];
  let gender: string | undefined;
  let height: string | undefined;
  let weight: string | undefined;
  let dateOfBirth: string | undefined;
  let heightUnit: string | undefined;
  let weightUnit: string | undefined;

  if (baselineStatsAnswer && typeof baselineStatsAnswer === "object" && !Array.isArray(baselineStatsAnswer)) {
    const stats = baselineStatsAnswer as Record<string, string | number>;
    gender = typeof stats.gender === "string" ? stats.gender : undefined;
    height = stats.height ? String(stats.height) : undefined;
    weight = stats.weight ? String(stats.weight) : undefined;
    dateOfBirth = typeof stats.dateOfBirth === "string" ? stats.dateOfBirth : undefined;
  }

  // Extract units for height and weight from quizAnswers.units[3]
  const unitsForQuestion3 = quizAnswers.units?.[3];
  if (unitsForQuestion3 && typeof unitsForQuestion3 === "object" && !Array.isArray(unitsForQuestion3)) {
    const unitsObj = unitsForQuestion3 as Record<string, string>;
    heightUnit = unitsObj.height || "cm";
    weightUnit = unitsObj.weight || "kg";
  } else {
    // Default units if not specified
    heightUnit = "cm";
    weightUnit = "kg";
  }

  const bodyTypeAnswer = answers[7]; // bodyType

  // Extract pain profile from quiz
  const painStatusAnswer = answers[10]; // painStatus (returns index)
  const painStatusOptions = ["Never", "In the past", "Yes, currently"];
  const painStatus = typeof painStatusAnswer === "number"
    ? painStatusOptions[painStatusAnswer]
    : undefined;

  const painLocationAnswer = answers[11]; // painLocation (returns array of indices)
  const painLocationOptions = [
    "Lower back (L5–S1)",
    "Middle back",
    "Upper back",
    "Sciatica",
    "Leg",
    "Shoulder",
    "Other",
  ];
  const painLocation = Array.isArray(painLocationAnswer)
    ? painLocationAnswer.map((idx) => painLocationOptions[idx as number])
    : undefined;

  const painTriggersAnswer = answers[13]; // painTriggers (returns array of indices)
  const painTriggersOptions = [
    "walking",
    "Bending forward",
    "Lifting heavy objects",
    "Long sitting",
    "Running or jumping",
    "Deadlifts / squats with weight",
    "Other activities",
  ];
  const painTriggers = Array.isArray(painTriggersAnswer)
    ? painTriggersAnswer.map((idx) => painTriggersOptions[idx as number])
    : undefined;

  const canSquatAnswer = answers[14]; // canSquat (returns index)
  const canSquatOptions = ["Yes", "Sometimes", "No", "Haven't tried"];
  const canSquat = typeof canSquatAnswer === "number"
    ? canSquatOptions[canSquatAnswer]
    : undefined;

  // Question 12: painLevel - slider (returns string or number 0-10)
  const painLevelAnswer = answers[12];
  const painLevel = painLevelAnswer !== undefined
    ? (typeof painLevelAnswer === "number" ? painLevelAnswer : Number(painLevelAnswer))
    : undefined;

  // Map bodyType - depends on gender from baselineStats
  let bodyType: string | undefined;
  if (typeof bodyTypeAnswer === "number") {
    const isFemale = gender === "Female";
    const bodyTypeOptions = isFemale
      ? ["18-24", "25-31", "32-38", "38+"]
      : ["8-15", "16-22", "23-30", "30+"];
    bodyType = bodyTypeOptions[bodyTypeAnswer];
  }

  return {
    ...planSettings,
    goal,
    experience,
    workoutsPerWeek,
    duration,
    durationRange: durationValue,
    trainingSplit,
    // User profile
    gender,
    height,
    heightUnit,
    weight,
    weightUnit,
    dateOfBirth,
    bodyType,
    // Pain profile
    painStatus,
    painLocation,
    painLevel,
    painTriggers,
    canSquat,
  };
}

/**
 * Extract pain profile from quiz answers
 */
function extractPainProfile(quizAnswers: QuizAnswers | null): PainProfile {
  if (!quizAnswers || !quizAnswers.answers) {
    return {
      painStatus: "Never",
    };
  }

  const answers = quizAnswers.answers;

  // Question 10: painStatus - radio (returns index)
  const painStatusAnswer = findAnswerByFieldName(answers, 10);
  const painStatusOptions = ["Never", "In the past", "Yes, currently"];
  const painStatus = typeof painStatusAnswer === "number"
    ? (painStatusOptions[painStatusAnswer] as "Never" | "In the past" | "Yes, currently")
    : "Never";

  // Question 11: painLocation - checkbox (returns array of indices)
  const painLocationAnswer = findAnswerByFieldName(answers, 11);
  const painLocationOptions = [
    "Lower back (L5–S1)",
    "Middle back",
    "Upper back",
    "Sciatica",
    "Leg",
    "Shoulder",
    "Other",
  ];
  const painLocation = Array.isArray(painLocationAnswer)
    ? painLocationAnswer.map((idx) => painLocationOptions[Number(idx)])
    : undefined;

  // Question 12: painLevel - slider (returns number 0-10)
  const painLevel = findAnswerByFieldName(answers, 12) as number | undefined;

  // Question 13: painTriggers - checkbox (returns array of indices)
  const painTriggersAnswer = findAnswerByFieldName(answers, 13);
  const painTriggersOptions = [
    "walking",
    "Bending forward",
    "Lifting heavy objects",
    "Long sitting",
    "Running or jumping",
    "Deadlifts / squats with weight",
    "Other activities",
  ];
  const painTriggers = Array.isArray(painTriggersAnswer)
    ? painTriggersAnswer.map((idx) => painTriggersOptions[Number(idx)])
    : undefined;

  // Question 14: canSquat - radio (returns index)
  const canSquatAnswer = findAnswerByFieldName(answers, 14);
  const canSquatOptions = ["Yes", "Sometimes", "No", "Haven't tried"];
  const canSquat = typeof canSquatAnswer === "number"
    ? canSquatOptions[canSquatAnswer]
    : undefined;

  return {
    painStatus,
    painLocation,
    painLevel,
    painTriggers,
    canSquat,
  };
}

/**
 * Extract pain profile from SourceOnboarding (alternative to extractPainProfile)
 * Used when generating alternatives from an existing plan
 */
function extractPainProfileFromSource(sourceOnboarding: SourceOnboarding | null): PainProfile {
  if (!sourceOnboarding) {
    return {
      painStatus: "Never",
    };
  }

  return {
    painStatus: (sourceOnboarding.painStatus as "Never" | "In the past" | "Yes, currently") || "Never",
    painLocation: sourceOnboarding.painLocation,
    painLevel: undefined, // Not stored in SourceOnboarding
    painTriggers: sourceOnboarding.painTriggers,
    canSquat: sourceOnboarding.canSquat,
  };
}

/**
 * Find answer by question ID
 */
function findAnswerByFieldName(
  answers: Record<number, number | number[] | string | Record<string, string | number>>,
  questionId: number
): number | number[] | string | Record<string, string | number> | undefined {
  return answers[questionId];
}

/**
 * Parse workouts per week from plan settings
 */
function parseWorkoutsPerWeek(workoutsPerWeek: string): number {
  // Extract number from string like "3 days per week" or "5+"
  const match = workoutsPerWeek.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 3; // Default to 3 if parsing fails
}

/**
 * Generate unique plan ID
 */
function generatePlanId(): string {
  return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate plan name based on settings
 */
function generatePlanName(settings: PlanSettings): string {
  const split = settings.trainingSplit;
  const frequency = parseWorkoutsPerWeek(settings.workoutsPerWeek);

  return `${split} - ${frequency}x per week`;
}

/**
 * Save generated plan to localStorage
 */
export function savePlanToLocalStorage(plan: GeneratedPlan): void {
  try {
    localStorage.setItem("generatedPlan", JSON.stringify(plan));
    localStorage.setItem("activePlanId", plan.id);
    console.log("✅ Saved plan:", {
      id: plan.id,
      size: JSON.stringify(plan).length,
      exercises: plan.workoutDays.reduce((sum, d) => sum + d.exercises.length, 0)
    });
  } catch (error) {
    console.error("Failed to save plan to localStorage:", error);
  }
}

/**
 * Save alternative splits to localStorage (separate from main plan)
 */
export function saveAlternativeSplitsToLocalStorage(alternatives: AlternativeSplit[]): void {
  try {
    localStorage.setItem("alternativeSplits", JSON.stringify(alternatives));
    console.log("✅ Saved alternatives:", alternatives.length);
  } catch (error) {
    console.error("Failed to save alternatives to localStorage:", error);
  }
}

/**
 * Load generated plan from localStorage
 */
export function loadPlanFromLocalStorage(): GeneratedPlan | null {
  try {
    const planData = localStorage.getItem("generatedPlan");
    if (!planData) return null;

    return JSON.parse(planData) as GeneratedPlan;
  } catch (error) {
    console.error("Failed to load plan from localStorage:", error);
    return null;
  }
}

/**
 * Load alternative splits from localStorage
 */
export function loadAlternativeSplitsFromLocalStorage(): AlternativeSplit[] {
  try {
    const data = localStorage.getItem("alternativeSplits");
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load alternatives from localStorage:", error);
    return [];
  }
}

/**
 * Get today's workout from the generated plan
 */
export function getTodaysWorkout(plan: GeneratedPlan): WorkoutDay | null {
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Adjust to match our 0 = Monday system
  const adjustedDay = today === 0 ? 6 : today - 1;

  // Find workout for today
  const todaysWorkout = plan.workoutDays.find(
    (day) => day.dayNumber === adjustedDay
  );

  return todaysWorkout || null;
}

/**
 * Clear generated plan from localStorage
 */
export function clearGeneratedPlan(): void {
  try {
    localStorage.removeItem("generatedPlan");
    localStorage.removeItem("activePlanId");
  } catch (error) {
    console.error("Failed to clear plan from localStorage:", error);
  }
}

/**
 * Switch to an alternative split plan by ID
 * Replaces the current workoutDays with the alternative's workoutDays
 */
export function switchToAlternativePlan(alternativeId: string): GeneratedPlan | null {
  try {
    const plan = loadPlanFromLocalStorage();
    if (!plan) return null;

    // Load alternatives from separate storage
    const alternatives = loadAlternativeSplitsFromLocalStorage();
    if (alternatives.length === 0) {
      console.warn(`[switchToAlternativePlan] No alternative splits found in storage`);
      return null;
    }

    const alternative = alternatives.find((alt) => alt.id === alternativeId);
    if (!alternative) return null;

    const updatedPlan: GeneratedPlan = {
      ...plan,
      workoutDays: alternative.workoutDays,
      splitType: alternative.splitType,
      // Update name to reflect the new split
      name: `${alternative.name} - ${plan.settings.workoutsPerWeek}`,
    };

    savePlanToLocalStorage(updatedPlan);
    return updatedPlan;
  } catch (error) {
    console.error("Failed to switch to alternative plan:", error);
    return null;
  }
}

/**
 * Switch to an alternative split plan by splitType
 * Used by the Swap Workout action sheet
 */
export function switchToSplit(splitType: "FULL_BODY" | "FULL_BODY_AB" | "PPL" | "UPPER_LOWER" | "UPPER_LOWER_UPPER" | "BRO_SPLIT" | "FRESH_MUSCLES"): GeneratedPlan | null {
  try {

    const plan = loadPlanFromLocalStorage();
    if (!plan) return null;

    // Load alternatives from separate storage
    const alternatives = loadAlternativeSplitsFromLocalStorage();
    if (alternatives.length === 0) {
      console.warn(`[switchToSplit] No alternative splits found in storage`);
      return null;
    }

    // Find the alternative with matching splitType
    const alternative = alternatives.find((alt) => alt.splitType === splitType);
    if (!alternative) {
      console.warn(`[switchToSplit] No alternative split found for type: ${splitType}`);
      return null;
    }

    // Create updated plan with new split
    const updatedPlan: GeneratedPlan = {
      ...plan,
      workoutDays: alternative.workoutDays,
      splitType: alternative.splitType,
      name: `${alternative.name} - ${plan.settings.workoutsPerWeek}`,
      settings: {
        ...plan.settings,
        trainingSplit:
          splitType === "BRO_SPLIT" ? "Upper/Lower" :
            splitType === "PPL" ? "Push/Pull/Legs" :
              "Fresh Muscle Groups"
      }
    };

    // Persist the change
    savePlanToLocalStorage(updatedPlan);
    console.log(`[switchToSplit] Successfully switched to ${alternative.name}`);
    return updatedPlan;
  } catch (error) {
    console.error("Failed to switch to split:", error);
    return null;
  }
}

/**
 * Get all available split plans (primary + alternatives)
 * Reads alternatives from separate storage
 */
export function getAvailablePlans(plan: GeneratedPlan | null): Array<{
  id: string;
  name: string;
  splitType: string;
  description: string;
  isPrimary: boolean;
  dayCount: number;
}> {
  if (!plan) return [];

  const plans = [
    {
      id: plan.id,
      name: plan.name,
      splitType: "Primary",
      description: "Your generated primary plan based on quiz answers",
      isPrimary: true,
      dayCount: plan.workoutDays.length,
    },
  ];

  // Load alternatives from separate storage
  const alternatives = loadAlternativeSplitsFromLocalStorage();
  if (alternatives.length > 0) {
    plans.push(
      ...alternatives.map((alt) => ({
        id: alt.id,
        name: alt.name,
        splitType: alt.splitType,
        description: alt.description,
        isPrimary: false,
        dayCount: alt.workoutDays.length,
      }))
    );
  }

  return plans;
}
