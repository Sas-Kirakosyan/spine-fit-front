import { z } from "zod";

// Runtime validation of the model's structured output. generateObject already
// constrains the model via this schema, but provider schema dialects differ
// (some ignore minItems/minLength), so zod still validates post-hoc. Uses
// z.object (not looseObject): the output is ours to dictate, so unexpected keys
// signal the model went off-script. .min(1) rejects useless-but-valid shapes
// like { planName, weeks, days: [] } or a day with an empty exercises array.
// notes is nullable (NOT optional): OpenAI strict structured outputs reject
// schemas where any property is missing from `required`, so the key must
// always be present — models emit `notes: null` when there is nothing to say.
export const planResponseSchema = z.object({
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
              notes: z.string().nullable(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

export type PlanResponseValidated = z.infer<typeof planResponseSchema>;
