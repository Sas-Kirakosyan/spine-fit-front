import { SchemaType, type Schema } from "@google/generative-ai";
import { z } from "zod";

export interface GeminiExercise {
  exerciseId: number;
  sets: number;
  reps: number;
  weight: number;
  weight_unit: string;
  notes?: string;
}

export interface GeminiDay {
  dayName: string;
  exercises: GeminiExercise[];
}

export interface GeminiPlanResponse {
  planName: string;
  weeks: number;
  days: GeminiDay[];
}

export const PLAN_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    planName: { type: SchemaType.STRING },
    weeks: { type: SchemaType.NUMBER },
    days: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dayName: { type: SchemaType.STRING },
          exercises: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                exerciseId: { type: SchemaType.NUMBER },
                sets: { type: SchemaType.NUMBER },
                reps: { type: SchemaType.NUMBER },
                weight: { type: SchemaType.NUMBER },
                weight_unit: { type: SchemaType.STRING },
                notes: { type: SchemaType.STRING },
              },
              required: ["exerciseId", "sets", "reps", "weight", "weight_unit"],
            },
          },
        },
        required: ["dayName", "exercises"],
      },
    },
  },
  required: ["planName", "weeks", "days"],
};

// Runtime validation of the model's parsed JSON. PLAN_SCHEMA above constrains
// the model's output, but truncation (MAX_TOKENS) and safety blocks can still
// yield valid-JSON-but-wrong-shape responses, so we re-validate here. Uses
// z.object (not looseObject): the output is ours to dictate, so unexpected keys
// signal the model went off-script. .min(1) rejects useless-but-valid shapes
// like { planName, weeks, days: [] } or a day with an empty exercises array.
export const geminiPlanResponseSchema = z.object({
  planName: z.string().min(1),
  weeks: z.number(),
  days: z
    .array(
      z.object({
        dayName: z.string().min(1),
        exercises: z
          .array(
            z.object({
              exerciseId: z.number(),
              sets: z.number(),
              reps: z.number(),
              weight: z.number(),
              weight_unit: z.string(),
              notes: z.string().optional(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

export type GeminiPlanResponseValidated = z.infer<typeof geminiPlanResponseSchema>;
