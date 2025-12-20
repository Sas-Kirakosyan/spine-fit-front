import type { FinishedWorkoutSummary, ExerciseSetRow } from "@/types/workout";
import type { Exercise } from "@/types/exercise";

export interface ProgressionSuggestion {
  exerciseId: number;
  lastPerformed?: {
    date: string;
    sets: ExerciseSetRow[];
    averageWeight: number;
    averageReps: number;
  };
  suggestion: {
    weight: number;
    reps: number;
    reason: string;
  };
}

/**
 * Get last performed data for a specific exercise from workout history
 */
export function getLastPerformedData(
  exerciseId: number,
  workoutHistory: FinishedWorkoutSummary[]
): ProgressionSuggestion["lastPerformed"] | undefined {
  // Sort by most recent first
  const sortedHistory = [...workoutHistory].sort(
    (a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime()
  );

  // Find the most recent workout containing this exercise
  const lastWorkout = sortedHistory.find((workout) =>
    workout.completedExercises.some((ex) => ex.id === exerciseId)
  );

  if (!lastWorkout || !lastWorkout.completedExerciseLogs[exerciseId]) {
    return undefined;
  }

  const sets = lastWorkout.completedExerciseLogs[exerciseId];
  const completedSets = sets.filter((set) => set.completed);

  if (completedSets.length === 0) {
    return undefined;
  }

  // Calculate averages
  const totalWeight = completedSets.reduce(
    (sum, set) => sum + parseFloat(set.weight || "0"),
    0
  );
  const totalReps = completedSets.reduce(
    (sum, set) => sum + parseFloat(set.reps || "0"),
    0
  );

  return {
    date: lastWorkout.finishedAt,
    sets: completedSets,
    averageWeight: totalWeight / completedSets.length,
    averageReps: totalReps / completedSets.length,
  };
}

/**
 * Calculate days since last workout with this exercise
 */
export function getDaysSinceLastWorkout(
  exerciseId: number,
  workoutHistory: FinishedWorkoutSummary[]
): number | null {

  const lastPerformed = getLastPerformedData(exerciseId, workoutHistory);

  if (!lastPerformed) {
    return null;
  }

  const lastDate = new Date(lastPerformed.date);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Generate progression suggestion for an exercise
 */
export function generateProgressionSuggestion(
  exercise: Exercise,
  workoutHistory: FinishedWorkoutSummary[]
): ProgressionSuggestion {
  const lastPerformed = getLastPerformedData(exercise.id, workoutHistory);

  // If no history, use exercise defaults
  if (!lastPerformed) {
    return {
      exerciseId: exercise.id,
      suggestion: {
        weight: exercise.weight || 0,
        reps: exercise.reps || 10,
        reason: "Starting weight - no previous history",
      },
    };
  }

  const daysSince = getDaysSinceLastWorkout(exercise.id, workoutHistory);

  // If more than 7 days (1 week) since last workout, maintain or decrease weight
  if (daysSince && daysSince > 7) {
    const decreasePercentage = daysSince > 14 ? 0.9 : 0.95; // 10% decrease if >2 weeks, 5% if >1 week
    const adjustedWeight = Math.round(lastPerformed.averageWeight * decreasePercentage * 2) / 2; // Round to nearest 0.5

    return {
      exerciseId: exercise.id,
      lastPerformed,
      suggestion: {
        weight: adjustedWeight,
        reps: Math.round(lastPerformed.averageReps),
        reason: `Missed ${daysSince} days - reducing weight for safety`,
      },
    };
  }

  // If consistent training (≤7 days), suggest progressive overload
  return suggestProgressiveOverload(exercise, lastPerformed);
}

/**
 * Suggest progressive overload based on last performance
 */
function suggestProgressiveOverload(
  exercise: Exercise,
  lastPerformed: NonNullable<ProgressionSuggestion["lastPerformed"]>
): ProgressionSuggestion {
  const { averageWeight, averageReps } = lastPerformed;

  // Strategy 1: If reps are high (>12), increase weight
  if (averageReps > 12) {
    const newWeight = Math.round((averageWeight + 2.5) * 2) / 2; // Add 2.5kg, round to nearest 0.5

    return {
      exerciseId: exercise.id,
      lastPerformed,
      suggestion: {
        weight: newWeight,
        reps: Math.max(8, Math.floor(averageReps * 0.8)), // Reduce reps when increasing weight
        reason: "Increase weight - you completed high reps last time",
      },
    };
  }

  // Strategy 2: If reps are low-moderate (8-12), add 1-2 reps
  if (averageReps >= 8 && averageReps <= 12) {
    return {
      exerciseId: exercise.id,
      lastPerformed,
      suggestion: {
        weight: averageWeight,
        reps: Math.min(15, Math.ceil(averageReps + 1)),
        reason: "Increase reps - maintain weight and build endurance",
      },
    };
  }

  // Strategy 3: If reps are very low (<8), maintain current load
  return {
    exerciseId: exercise.id,
    lastPerformed,
    suggestion: {
      weight: averageWeight,
      reps: Math.ceil(averageReps),
      reason: "Maintain current load - focus on form",
    },
  };
}

/**
 * Apply progression suggestions to exercises
 */
export function applyProgressionToExercises(
  exercises: Exercise[],
  workoutHistory: FinishedWorkoutSummary[]
): Exercise[] {
  return exercises.map((exercise) => {
    const progression = generateProgressionSuggestion(exercise, workoutHistory);

    return {
      ...exercise,
      weight: progression.suggestion.weight,
      reps: progression.suggestion.reps,
      // Store progression info for UI display
      progressionInfo: progression,
    };
  });
}

/**
 * Check if user has been consistent with training (no gaps > 7 days)
 */
export function checkTrainingConsistency(
  workoutHistory: FinishedWorkoutSummary[],
  daysToCheck: number = 14
): {
  isConsistent: boolean;
  longestGap: number;
  totalWorkouts: number;
} {
  if (workoutHistory.length === 0) {
    return { isConsistent: false, longestGap: 0, totalWorkouts: 0 };
  }

  // Sort by date
  const sorted = [...workoutHistory].sort(
    (a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime()
  );

  // Get workouts within the specified time period
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToCheck);

  const recentWorkouts = sorted.filter(
    (workout) => new Date(workout.finishedAt) >= cutoffDate
  );

  if (recentWorkouts.length === 0) {
    return { isConsistent: false, longestGap: daysToCheck, totalWorkouts: 0 };
  }

  // Calculate gaps between workouts
  let longestGap = 0;

  for (let i = 0; i < recentWorkouts.length - 1; i++) {
    const current = new Date(recentWorkouts[i].finishedAt);
    const next = new Date(recentWorkouts[i + 1].finishedAt);
    const gap = Math.abs(current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);

    longestGap = Math.max(longestGap, gap);
  }

  // Check gap from most recent workout to today
  const daysSinceLastWorkout =
    (new Date().getTime() - new Date(sorted[0].finishedAt).getTime()) /
    (1000 * 60 * 60 * 24);
  longestGap = Math.max(longestGap, daysSinceLastWorkout);

  return {
    isConsistent: longestGap <= 7,
    longestGap: Math.ceil(longestGap),
    totalWorkouts: recentWorkouts.length,
  };
}
