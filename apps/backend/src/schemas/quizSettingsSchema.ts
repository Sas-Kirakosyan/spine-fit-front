import { z } from "zod";

/** Accepts any string, coerces empty string to undefined */
const optionalStr = z.string().optional().transform((v) => v || undefined);

export const quizSettingsSchema = z.looseObject({
  goal: z.string(),
  workoutsPerWeek: z.coerce.string(),
  duration: optionalStr,
  durationRange: optionalStr,
  experience: z.string(),
  trainingSplit: optionalStr,
  exerciseVariability: optionalStr.pipe(z.string().default("Balanced")),
  units: optionalStr.pipe(z.string().default("kg")),
  cardio: optionalStr.pipe(z.string().default("Off")),
  stretching: optionalStr.pipe(z.string().default("Off")),
  heightUnit: optionalStr.pipe(z.string().default("cm")),
  weightUnit: optionalStr.pipe(z.string().default("kg")),
  gender: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bodyType: z.string().optional(),
  painStatus: z.string().optional(),
  painLocation: z.array(z.string()).optional(),
  painLevel: z.number().min(0).max(10).optional(),
  painTriggers: z.array(z.string()).optional(),
  canSquat: z.string().optional(),
  additionalNotes: z.string().optional(),
  ageRange: z.string().optional(),
}).transform((data) => ({
  ...data,
  duration: data.duration ?? "",
  durationRange: data.durationRange ?? data.duration ?? "",
  trainingSplit: data.trainingSplit ?? "",
}));

export type ValidatedQuizData = z.output<typeof quizSettingsSchema>;
