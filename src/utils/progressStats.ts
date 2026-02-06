import type { FinishedWorkoutSummary } from "@/types/workout";
import { getExerciseEstimated1RM } from "./oneRepMax";

export interface TotalStats {
  totalWorkouts: number;
  totalVolume: number;
  totalCalories: number;
  currentStreak: number;
}

export interface WeeklyActivityDay {
  date: Date;
  dayName: string;
  hasWorkout: boolean;
  workoutCount: number;
}

export interface ProgressDataPoint {
  date: string;
  volume: number;
  label: string;
}

export interface PersonalRecord {
  exerciseName: string;
  exerciseId: number;
  estimated1RM: number;
  bestVolume: number;
  bestWeight: number;
  bestReps: number;
}

export interface WorkoutRecord {
  type: "volume" | "duration" | "exercises" | "calories";
  value: number;
  date: string;
  label: string;
}

export interface ExerciseProgress {
  exerciseId: number;
  exerciseName: string;
  imageUrl: string;
  estimated1RM: number;
  currentBest1RM: number;
  lastPerformed: string;
  progressData: Array<{ date: string; value: number }>;
}

/**
 * Calculate total stats from workout history
 */
export function calculateTotalStats(
  workouts: FinishedWorkoutSummary[]
): TotalStats {
  const totalWorkouts = workouts.length;
  const totalVolume = workouts.reduce((sum, w) => sum + w.totalVolume, 0);
  const totalCalories = workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
  const currentStreak = calculateStreak(workouts);

  return {
    totalWorkouts,
    totalVolume,
    totalCalories,
    currentStreak,
  };
}

/**
 * Calculate current streak (consecutive workout days)
 */
export function calculateStreak(workouts: FinishedWorkoutSummary[]): number {
  if (workouts.length === 0) return 0;

  const sorted = [...workouts].sort(
    (a, b) =>
      new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime()
  );

  // Получаем уникальные дни тренировок
  const workoutDays = new Set<string>();
  sorted.forEach((w) => {
    const date = new Date(w.finishedAt);
    const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    workoutDays.add(dayKey);
  });

  const uniqueDays = Array.from(workoutDays).sort().reverse();
  if (uniqueDays.length === 0) return 0;

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;

  // Streak должен начинаться с сегодня или вчера
  const lastWorkoutDay = uniqueDays[0];
  if (lastWorkoutDay !== todayKey && lastWorkoutDay !== yesterdayKey) {
    return 0;
  }

  let streak = 0;
  let checkDate = lastWorkoutDay === todayKey ? today : yesterday;

  for (let i = 0; i < 365; i++) {
    const checkKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
    if (workoutDays.has(checkKey)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get activity for the last 7 days
 */
export function getWeeklyActivity(
  workouts: FinishedWorkoutSummary[]
): WeeklyActivityDay[] {
  const days: WeeklyActivityDay[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayWorkouts = workouts.filter((w) => {
      const workoutDate = new Date(w.finishedAt);
      return workoutDate >= date && workoutDate < nextDay;
    });

    days.push({
      date,
      dayName: dayNames[date.getDay()],
      hasWorkout: dayWorkouts.length > 0,
      workoutCount: dayWorkouts.length,
    });
  }

  return days;
}

/**
 * Получение данных для графика прогресса (последние 10 тренировок)
 */
export function getProgressData(
  workouts: FinishedWorkoutSummary[],
  limit: number = 10
): ProgressDataPoint[] {
  const sorted = [...workouts]
    .sort(
      (a, b) =>
        new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime()
    )
    .slice(-limit);

  return sorted.map((w, index) => {
    const date = new Date(w.finishedAt);
    const label = `${date.getDate()}/${date.getMonth() + 1}`;
    return {
      date: w.finishedAt,
      volume: w.totalVolume,
      label,
    };
  });
}

/**
 * Get personal records by exercise
 */
export function getPersonalRecords(
  workouts: FinishedWorkoutSummary[]
): PersonalRecord[] {
  const exerciseRecords: Map<number, PersonalRecord> = new Map();

  workouts.forEach((workout) => {
    workout.completedExercises.forEach((exercise) => {
      const logs = workout.completedExerciseLogs[exercise.id] || [];
      if (logs.length === 0) return;

      const estimated1RM = getExerciseEstimated1RM(logs);
      const exerciseVolume = logs.reduce((sum, set) => {
        if (!set.completed) return sum;
        const weight = Number(set.weight) || 0;
        const reps = Number(set.reps) || 0;
        return sum + weight * reps;
      }, 0);

      const bestSet = logs.reduce(
        (best, set) => {
          const weight = Number(set.weight) || 0;
          const reps = Number(set.reps) || 0;
          if (weight > best.weight) {
            return { weight, reps };
          }
          return best;
        },
        { weight: 0, reps: 0 }
      );

      const existing = exerciseRecords.get(exercise.id);
      if (!existing || estimated1RM > existing.estimated1RM) {
        exerciseRecords.set(exercise.id, {
          exerciseName: exercise.name,
          exerciseId: exercise.id,
          estimated1RM,
          bestVolume: Math.max(exerciseVolume, existing?.bestVolume || 0),
          bestWeight: Math.max(bestSet.weight, existing?.bestWeight || 0),
          bestReps: Math.max(bestSet.reps, existing?.bestReps || 0),
        });
      } else if (existing) {
        existing.bestVolume = Math.max(exerciseVolume, existing.bestVolume);
        existing.bestWeight = Math.max(bestSet.weight, existing.bestWeight);
        existing.bestReps = Math.max(bestSet.reps, existing.bestReps);
      }
    });
  });

  return Array.from(exerciseRecords.values())
    .filter((r) => r.estimated1RM > 0)
    .sort((a, b) => b.estimated1RM - a.estimated1RM);
}

/**
 * Получение рекордов тренировок (лучший объем, длительность и т.д.)
 */
export function getWorkoutRecords(
  workouts: FinishedWorkoutSummary[]
): WorkoutRecord[] {
  if (workouts.length === 0) return [];

  const records: WorkoutRecord[] = [];

  const bestVolume = workouts.reduce(
    (best, w) => (w.totalVolume > best.totalVolume ? w : best),
    workouts[0]
  );
  records.push({
    type: "volume",
    value: bestVolume.totalVolume,
    date: bestVolume.finishedAt,
    label: "Best volume",
  });

  // Больше всего упражнений
  const mostExercises = workouts.reduce(
    (best, w) => (w.exerciseCount > best.exerciseCount ? w : best),
    workouts[0]
  );
  records.push({
    type: "exercises",
    value: mostExercises.exerciseCount,
    date: mostExercises.finishedAt,
    label: "Most exercises",
  });

  return records;
}

/**
 * Format volume for display
 */
export function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  }
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toLocaleString();
}

/**
 * Get all exercises with progress history
 */
export function getAllExercisesWithProgress(
  workouts: FinishedWorkoutSummary[]
): ExerciseProgress[] {
  const exerciseMap = new Map<number, ExerciseProgress>();

  // Sort workouts by date (oldest first)
  const sortedWorkouts = [...workouts].sort(
    (a, b) =>
      new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime()
  );

  sortedWorkouts.forEach((workout) => {
    workout.completedExercises.forEach((exercise) => {
      const logs = workout.completedExerciseLogs[exercise.id] || [];
      if (logs.length === 0) return;

      const estimated1RM = getExerciseEstimated1RM(logs);

      if (!exerciseMap.has(exercise.id)) {
        exerciseMap.set(exercise.id, {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          imageUrl: exercise.image_url || "",
          estimated1RM: 0,
          currentBest1RM: 0,
          lastPerformed: workout.finishedAt,
          progressData: [],
        });
      }

      const exerciseProgress = exerciseMap.get(exercise.id)!;
      exerciseProgress.lastPerformed = workout.finishedAt;
      exerciseProgress.currentBest1RM = Math.max(
        exerciseProgress.currentBest1RM,
        estimated1RM
      );
      exerciseProgress.progressData.push({
        date: workout.finishedAt,
        value: estimated1RM,
      });
    });
  });

  // Set final estimated1RM to currentBest1RM
  exerciseMap.forEach((progress) => {
    progress.estimated1RM = progress.currentBest1RM;
  });

  return Array.from(exerciseMap.values()).sort(
    (a, b) =>
      new Date(b.lastPerformed).getTime() - new Date(a.lastPerformed).getTime()
  );
}
