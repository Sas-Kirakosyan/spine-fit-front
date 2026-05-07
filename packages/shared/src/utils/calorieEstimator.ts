// MET-based calorie estimation for strength training.
// Reference: Compendium of Physical Activities — strength training ≈ 3.5–6.0 MET.
// Formula: kcal = MET × bodyWeightKg × hours

export const DEFAULT_STRENGTH_MET = 5.0;
export const DEFAULT_BODY_WEIGHT_KG = 70;
export const DEFAULT_BODY_WEIGHT_KG_MALE = 80;
export const DEFAULT_BODY_WEIGHT_KG_FEMALE = 60;

export type CalorieGender = "male" | "female" | "other";

export interface EstimateCaloriesInput {
  durationSeconds: number;
  bodyWeightKg?: number;
  gender?: CalorieGender;
  met?: number;
}

function fallbackWeightKg(gender?: CalorieGender): number {
  if (gender === "male") return DEFAULT_BODY_WEIGHT_KG_MALE;
  if (gender === "female") return DEFAULT_BODY_WEIGHT_KG_FEMALE;
  return DEFAULT_BODY_WEIGHT_KG;
}

export function estimateCalories({
  durationSeconds,
  bodyWeightKg,
  gender,
  met = DEFAULT_STRENGTH_MET,
}: EstimateCaloriesInput): number {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0;
  const weight =
    Number.isFinite(bodyWeightKg) && (bodyWeightKg as number) > 0
      ? (bodyWeightKg as number)
      : fallbackWeightKg(gender);
  const hours = durationSeconds / 3600;
  return Math.round(met * weight * hours);
}

export function lbsToKg(lbs: number): number {
  return lbs * 0.45359237;
}

export function parseBodyWeightToKg(
  weight: string | number | null | undefined,
  unit: "kg" | "lbs" | null | undefined
): number | undefined {
  const value = typeof weight === "string" ? Number(weight) : weight;
  if (!Number.isFinite(value) || (value as number) <= 0) return undefined;
  return unit === "lbs" ? lbsToKg(value as number) : (value as number);
}
