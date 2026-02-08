export interface VolumeParameters {
  workoutDuration: string; // e.g., "30–45 min"
  experience: "Beginner" | "Intermediate" | "Advanced";
  goal: string;
  painLevel?: number;
}

export interface VolumeRecommendation {
  totalSetsPerWorkout: number;
  setsPerExercise: number;
  repsPerSet: number;
  restBetweenSets: number; // seconds
}

/**
 * Calculate recommended training volume based on workout duration and user profile
 */
export function calculateVolume(params: VolumeParameters): VolumeRecommendation {
  const { workoutDuration, experience, goal, painLevel } = params;

  // Parse duration string to minutes
  const durationMinutes = parseDurationToMinutes(workoutDuration);

  // Base sets per workout based on duration
  let totalSets = calculateTotalSets(durationMinutes);

  // Adjust based on experience
  totalSets = adjustForExperience(totalSets, experience);

  // Adjust based on pain level
  if (painLevel && painLevel > 5) {
    totalSets = Math.floor(totalSets * 0.8); // Reduce volume by 20% if in pain
  }

  // Calculate sets per exercise
  const setsPerExercise = calculateSetsPerExercise(experience);

  // Calculate reps based on goal
  const repsPerSet = calculateRepsForGoal(goal, painLevel);

  // Calculate rest time
  const restBetweenSets = calculateRestTime(experience, goal);

  return {
    totalSetsPerWorkout: totalSets,
    setsPerExercise,
    repsPerSet,
    restBetweenSets,
  };
}

/**
 * Parse workout duration string to minutes
 */
function parseDurationToMinutes(duration: string): number {
  const matches = duration.match(/(\d+)/g);
  if (!matches) return 30; // Default to 30 minutes

  // Take the lower bound of the range
  return parseInt(matches[0], 10);
}

/**
 * Calculate total sets based on workout duration
 * Assumes ~3-4 minutes per set (including exercise time + rest)
 */
function calculateTotalSets(durationMinutes: number): number {
  const minutesPerSet = 3.5;
  const warmupTime = 5; // 5 minutes for warmup
  const availableTime = durationMinutes - warmupTime;

  return Math.floor(availableTime / minutesPerSet);
}

/**
 * Adjust total sets based on experience level
 */
function adjustForExperience(
  baseSets: number,
  experience: string
): number {
  const multipliers = {
    Beginner: 0.8, // Reduce volume for beginners
    Intermediate: 1.0,
    Advanced: 1.2, // Increase volume for advanced
  };

  const multiplier = multipliers[experience as keyof typeof multipliers] || 1.0;
  return Math.floor(baseSets * multiplier);
}

/**
 * Calculate sets per exercise based on experience
 */
function calculateSetsPerExercise(experience: string): number {
  const setsMap = {
    Beginner: 3,
    Intermediate: 4, // Increased from 3 to 4 for adequate hypertrophy stimulus
    Advanced: 4,
  };

  return setsMap[experience as keyof typeof setsMap] || 3;
}

/**
 * Calculate reps per set based on goal and pain level
 */
function calculateRepsForGoal(goal: string, painLevel?: number): number {
  const isMuscleBuildingGoal = goal.toLowerCase().includes("build muscle");
  const isPainReductionGoal = goal.toLowerCase().includes("reduce pain") ||
    goal.toLowerCase().includes("back health");

  // If in significant pain, use higher reps (lighter weight)
  if (painLevel && painLevel > 6) {
    return 15;
  }

  // Muscle building: hypertrophy range
  if (isMuscleBuildingGoal) {
    return painLevel && painLevel > 3 ? 12 : 10;
  }

  // Pain reduction: higher reps, lower intensity
  if (isPainReductionGoal) {
    return 15;
  }

  // Default: moderate rep range
  return 12;
}

/**
 * Calculate rest time between sets
 */
function calculateRestTime(experience: string, goal: string): number {
  const isMuscleBuildingGoal = goal.toLowerCase().includes("build muscle");

  // Advanced users with muscle building goals need more rest
  if (experience === "Advanced" && isMuscleBuildingGoal) {
    return 120; // 2 minutes
  }

  // Beginners and pain reduction need less rest (lighter weights)
  if (experience === "Beginner" || goal.toLowerCase().includes("reduce pain")) {
    return 60; // 1 minute
  }

  // Default: 90 seconds
  return 90;
}

/**
 * Calculate number of exercises per workout based on total sets and sets per exercise
 */
export function calculateExercisesPerWorkout(
  totalSets: number,
  setsPerExercise: number
): number {
  return Math.floor(totalSets / setsPerExercise);
}
