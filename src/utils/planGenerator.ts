import type { Exercise } from "@/types/exercise";
import type { PlanSettings } from "@/types/planSettings";
import type { FinishedWorkoutSummary } from "@/types/workout";
import type { QuizAnswers } from "@/types/quiz";

import { filterExercisesByProfile, getAlternativeExercises, type FilterCriteria, type PainProfile } from "./exerciseFilter";
import { mapSplitToMuscleGroups, assignExercisesToDays, getMissingMuscleGroups, createWeeklySchedule, type WorkoutDay } from "./splitScheduler";
import { calculateVolume, calculateExercisesPerWorkout } from "./volumeCalculator";
import { applyProgressionToExercises } from "./progressiveOverload";

export interface GeneratedPlan {
  id: string;
  name: string;
  createdAt: string;
  settings: PlanSettings;
  workoutDays: WorkoutDay[];
  missingMuscleGroups: string[];
  alternativeExercises: Exercise[];
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
  // 1. Extract pain profile from quiz answers
  const painProfile = extractPainProfile(quizAnswers);

  // 2. Create filter criteria
  const filterCriteria: FilterCriteria = {
    availableEquipment,
    painProfile,
    experience: planSettings.experience as "Beginner" | "Intermediate" | "Advanced",
    goal: planSettings.goal,
  };

  // 3. Filter exercises based on user profile
  let filteredExercises = filterExercisesByProfile(allExercises, filterCriteria);

  // 4. Apply progressive overload based on workout history
  if (workoutHistory.length > 0) {
    filteredExercises = applyProgressionToExercises(filteredExercises, workoutHistory);
  }

  // 5. Calculate volume recommendations
  const volumeRecommendation = calculateVolume({
    workoutDuration: planSettings.duration,
    experience: planSettings.experience as "Beginner" | "Intermediate" | "Advanced",
    goal: planSettings.goal,
    painLevel: painProfile.painLevel,
  });

  // 6. Calculate how many exercises per workout
  const exercisesPerWorkout = calculateExercisesPerWorkout(
    volumeRecommendation.totalSetsPerWorkout,
    volumeRecommendation.setsPerExercise
  );

  // 7. Parse workouts per week from plan settings
  const workoutsPerWeek = parseWorkoutsPerWeek(planSettings.workoutsPerWeek);

  // 8. Create weekly schedule structure
  const weeklySchedule = createWeeklySchedule(
    planSettings.trainingSplit,
    workoutsPerWeek
  );

  // 9. Map training split to muscle groups per day
  const muscleGroupsByDay = mapSplitToMuscleGroups(
    planSettings.trainingSplit,
    workoutsPerWeek
  );

  // 10. Assign exercises to workout days
  const workoutDays = assignExercisesToDays(
    filteredExercises,
    muscleGroupsByDay,
    exercisesPerWorkout
  );

  // 11. Apply sets and reps to each exercise
  const workoutDaysWithVolume = workoutDays.map((day) => ({
    ...day,
    exercises: day.exercises.map((exercise) => ({
      ...exercise,
      sets: volumeRecommendation.setsPerExercise,
      reps: volumeRecommendation.repsPerSet,
    })),
  }));

  // 12. Check for missing muscle groups
  const allTargetMuscleGroups = muscleGroupsByDay.flat();
  const missingMuscleGroups = getMissingMuscleGroups(
    allTargetMuscleGroups,
    filteredExercises
  );

  // 13. Get alternative exercises for missing muscle groups
  const alternativeExercises = missingMuscleGroups.length > 0
    ? getAlternativeExercises(allExercises, missingMuscleGroups)
    : [];

  // 14. Generate plan metadata
  const planId = generatePlanId();
  const planName = generatePlanName(planSettings);

  return {
    id: planId,
    name: planName,
    createdAt: new Date().toISOString(),
    settings: planSettings,
    workoutDays: workoutDaysWithVolume,
    missingMuscleGroups,
    alternativeExercises,
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

  // Find question IDs based on fieldName (from questions.ts)
  const painStatusAnswer = findAnswerByFieldName(answers, 10); // painStatus question
  const painLocationAnswer = findAnswerByFieldName(answers, 11); // painLocation question
  const painLevelAnswer = findAnswerByFieldName(answers, 12); // painLevel question
  const painTriggersAnswer = findAnswerByFieldName(answers, 13); // painTriggers question
  const canSquatAnswer = findAnswerByFieldName(answers, 14); // canSquat question

  return {
    painStatus: (painStatusAnswer as "Never" | "In the past" | "Yes, currently") || "Never",
    painLocation: Array.isArray(painLocationAnswer) ? painLocationAnswer.map(String) : undefined,
    painLevel: typeof painLevelAnswer === "number" ? painLevelAnswer : undefined,
    painTriggers: Array.isArray(painTriggersAnswer) ? painTriggersAnswer.map(String) : undefined,
    canSquat: canSquatAnswer as string | undefined,
  };
}

/**
 * Find answer by question ID
 */
function findAnswerByFieldName(
  answers: Record<number, number | number[] | string>,
  questionId: number
): number | number[] | string | undefined {
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
  } catch (error) {
    console.error("Failed to save plan to localStorage:", error);
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
