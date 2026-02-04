import type { ExerciseSetRow } from "@/types/workout";

/**
 * Epley formula for 1RM
 * More accurate for high reps (10+)
 * 1RM = weight × (1 + reps/30)
 */
export function epley1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/**
 * Формула Brzycki для расчета 1RM
 * Более точная для низких повторений (1-10)
 * 1RM = weight × 36/(37-reps)
 */
export function brzycki1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  if (reps >= 37) return weight; // formula undefined for 37+ reps
  return weight * (36 / (37 - reps));
}

/**
 * Combined 1RM calculation
 * Brzycki for 1-10 reps, Epley for 10+
 */
export function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps <= 10) return brzycki1RM(weight, reps);
  return epley1RM(weight, reps);
}

/**
 * Расчет estimated 1RM для упражнения на основе лучшего сета
 */
export function getExerciseEstimated1RM(logs: ExerciseSetRow[]): number {
  if (!logs.length) return 0;

  const estimates = logs
    .filter((set) => set.completed)
    .map((set) => {
      const weight = Number(set.weight);
      const reps = Number(set.reps);
      if (Number.isNaN(weight) || Number.isNaN(reps)) return 0;
      return calculate1RM(weight, reps);
    });

  return estimates.length > 0 ? Math.max(...estimates) : 0;
}

/**
 * Get percentage of 1RM for given weight
 */
export function getPercentOf1RM(weight: number, oneRepMax: number): number {
  if (oneRepMax <= 0) return 0;
  return Math.round((weight / oneRepMax) * 100);
}
