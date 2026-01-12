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
  const weeklySchedule = createWeeklySchedule(
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
    exercisesPerWorkout
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
  const planName = generatePlanName(effectivePlanSettings);

  return {
    id: planId,
    name: planName,
    createdAt: new Date().toISOString(),
    settings: effectivePlanSettings,
    workoutDays: workoutDaysWithVolume,
    missingMuscleGroups,
    alternativeExercises,
  };
}

/**
 * Merge plan settings with quiz answers
 * Maps quiz answers to plan settings format
 * 
 * Quiz Answer IDs:
 * - 1.5: workoutType (not in answers, handled separately)
 * - 2: goal
 * - 3: gender
 * - 4: ageRange
 * - 5: height
 * - 6: weight
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
  if (durationValue.includes("10–20")) duration = "30 min";
  else if (durationValue.includes("20–30")) duration = "30 min";
  else if (durationValue.includes("30–45")) duration = "45 min";
  else if (durationValue.includes("45–60")) duration = "1 hr";

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

  return {
    ...planSettings,
    goal,
    experience,
    workoutsPerWeek,
    duration,
    trainingSplit,
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
