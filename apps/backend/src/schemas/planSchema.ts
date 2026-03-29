import { SchemaType, type Schema } from "@google/generative-ai";

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
