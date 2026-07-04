import { GoogleGenerativeAI } from "@google/generative-ai";
import type { PromptExercise } from "../utils/exerciseFilter.js";
import type { ParsedQuizData } from "../types.js";
import {
  PLAN_SCHEMA,
  geminiPlanResponseSchema,
  type GeminiPlanResponseValidated,
} from "../schemas/planSchema.js";
import {
  ACTIVE_PAIN_GOAL,
  buildSystemInstruction,
  buildUserPrompt,
  reconcileSplitWithLLMOutput,
  resolveEffectiveSplit,
} from "../utils/promptBuilder.js";
import { SPLIT_TARGET_MUSCLES, mapSplitType } from "../utils/splitUtils.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-3.5-flash";

/**
 * Thrown when every model attempt fails to produce a valid plan. Carries
 * per-attempt reasons for logging plus a `retryable` flag the route uses to
 * pick the HTTP status:
 *   - retryable=true  → the AI service itself never delivered a response
 *     (overload, 5xx, rate limit, network/timeout). Worth retrying → 503.
 *   - retryable=false → we got a response but its content is unusable (bad
 *     JSON, schema mismatch, blocked/truncated, zero usable exercises) or the
 *     request is permanently misconfigured. Retrying won't help → 502.
 */
export class PlanGenerationError extends Error {
  readonly attempts: { model: string; reason: string }[];
  readonly retryable: boolean;
  constructor(
    message: string,
    attempts: { model: string; reason: string }[],
    retryable: boolean,
  ) {
    super(message);
    this.name = "PlanGenerationError";
    this.attempts = attempts;
    this.retryable = retryable;
  }
}

/** Defensively strip a ```json … ``` markdown fence the model may wrap around its output. */
function stripJsonFences(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }
  return s;
}

/**
 * Parse + validate the model's text into a known-good plan shape. Throws a
 * code-prefixed Error on either failure; the per-model loop records it as the
 * attempt reason and moves on to the fallback model.
 */
function safeParsePlan(rawText: string): GeminiPlanResponseValidated {
  const cleaned = stripJsonFences(rawText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `JSON_PARSE_FAILED: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  const result = geminiPlanResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `SCHEMA_VALIDATION_FAILED: ${JSON.stringify(result.error.flatten())}`,
    );
  }
  return result.data;
}

// Shape compatible with the frontend's GeneratedPlan type from @spinefit/shared
export interface GeneratedPlanResult {
  id: string;
  name: string;
  splitType: string;
  weeks: number;
  createdAt: string;
  settings: {
    goal: string;
    originalGoal?: string;
    workoutsPerWeek: string;
    duration: string;
    experience: string;
    trainingSplit: string;
    exerciseVariability: string;
    units: string;
    cardio: string;
    stretching: string;
    gender?: string;
    height?: string;
    heightUnit?: string;
    weight?: string;
    weightUnit?: string;
    birthYear?: number;
    dateOfBirth?: string;
    bodyType?: string;
    painStatus?: string;
    painLocation?: string[];
    painLevel?: number;
    painTriggers?: string[];
    canSquat?: string;
    additionalNotes?: string;
  };
  workoutDays: {
    dayNumber: number;
    dayName: string;
    muscleGroups: string[];
    exercises: Record<string, unknown>[];
  }[];
  missingMuscleGroups: string[];
  alternativeExercises: unknown[];
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function generatePlan(
  parsedQuiz: ParsedQuizData,
  exercises: PromptExercise[],
  allExercisesRaw: Record<string, unknown>[],
): Promise<GeneratedPlanResult> {
  const prompt = buildUserPrompt(parsedQuiz, exercises);

  const callGemini = async (modelName: string): Promise<string> => {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: buildSystemInstruction(parsedQuiz),
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: PLAN_SCHEMA,
      },
    });

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (err) {
      // The HTTP call to Gemini itself failed: overload (503), rate limit (429),
      // 5xx, network, or timeout — the service never delivered a response.
      // Tag it AI_SERVICE_ERROR (retryable) so the client retries a few times,
      // EXCEPT for clearly-permanent client/config errors (bad key, malformed
      // request), where retrying is pointless — those are AI_CONFIG_ERROR (terminal).
      const msg = err instanceof Error ? err.message : String(err);
      const permanent =
        /\b(400|401|403)\b|api[_ ]?key|permission|unauthorized|invalid argument/i.test(
          msg,
        );
      throw new Error(
        `${permanent ? "AI_CONFIG_ERROR" : "AI_SERVICE_ERROR"}: ${msg}`,
      );
    }
    const response = result.response;

    // Validate the candidate before reading text. A blocked prompt, a missing
    // candidate, or a non-STOP finishReason (MAX_TOKENS truncation, SAFETY,
    // RECITATION, …) means .text() would be empty/partial/invalid — treat it as
    // a hard failure so the loop falls through to the fallback model instead of
    // parsing garbage. We do not salvage partial text and do not issue a repair call.
    const blockReason = response.promptFeedback?.blockReason;
    if (blockReason) {
      throw new Error(`PROMPT_BLOCKED: ${blockReason}`);
    }
    const candidate = response.candidates?.[0];
    if (!candidate) {
      throw new Error("NO_CANDIDATES: model returned no candidates");
    }
    const finishReason = candidate.finishReason;
    if (finishReason && finishReason !== "STOP") {
      throw new Error(`BAD_FINISH_REASON: ${finishReason}`);
    }

    const usage = response.usageMetadata;
    if (usage) {
      const thinking =
        (usage as unknown as Record<string, unknown>).thoughtsTokenCount ?? 0;
      console.log(
        `[Gemini ${model.model}] Tokens \n prompt: ${usage.promptTokenCount}\n thinking: ${thinking}\n response: ${usage.candidatesTokenCount}\n total: ${usage.totalTokenCount}\n`,
      );
    }

    return response.text();
  };

  // Try each model in turn; an attempt = call → finishReason check → parse →
  // schema validate. A single catch covers BOTH network errors AND parse/
  // validation failures, so a bad-JSON response from the primary model now
  // falls through to the fallback (it previously crashed). At most two
  // round-trips, no repair call. If all fail, throw a typed error → HTTP 502.
  const models = [PRIMARY_MODEL, FALLBACK_MODEL];
  const attempts: { model: string; reason: string }[] = [];
  let geminiPlan: GeminiPlanResponseValidated | null = null;
  for (const modelName of models) {
    try {
      const text = await callGemini(modelName);
      geminiPlan = safeParsePlan(text);
      break;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      attempts.push({ model: modelName, reason });
      console.warn(`[Gemini] ⚠ Model "${modelName}" attempt failed: ${reason}`);
    }
  }
  if (!geminiPlan) {
    // Retry (client-side, capped at 3 attempts) only when EVERY attempt was a
    // pure service outage. If any attempt actually returned unusable content,
    // retrying would likely keep failing the same way → terminal (drop the
    // user to workout).
    const retryable =
      attempts.length > 0 &&
      attempts.every((a) => a.reason.startsWith("AI_SERVICE_ERROR"));
    throw new PlanGenerationError(
      "All model attempts failed to produce a valid plan",
      attempts,
      retryable,
    );
  }
  console.log("geminiPlan", JSON.stringify(geminiPlan));

  // Build a lookup map from exercise ID → full exercise object
  const exerciseMap = new Map<number, Record<string, unknown>>();
  for (const ex of allExercisesRaw) {
    exerciseMap.set(ex.id as number, ex);
  }

  // Validate returned exercise IDs against the known exercise map
  const allReturnedIds = geminiPlan.days.flatMap((d) =>
    d.exercises.map((e) => e.exerciseId),
  );
  const missingIds = allReturnedIds.filter((id) => !exerciseMap.has(id));
  if (missingIds.length > 0) {
    console.warn(
      `[Gemini] ⚠ ${missingIds.length} unknown exercise ID(s): [${missingIds.join(", ")}] — these will be dropped`,
    );
  }

  // Convert Gemini days → WorkoutDay[] (with full exercise objects)
  const workoutDays = geminiPlan.days.map((day, index) => {
    const resolvedExercises = day.exercises
      .map((ge) => {
        const base = exerciseMap.get(ge.exerciseId);
        if (!base) return null;
        return {
          ...base,
          sets: ge.sets,
          reps: ge.reps,
          weight: ge.weight,
          weight_unit: ge.weight_unit,
          ...(ge.notes ? { restriction_note: ge.notes } : {}),
        };
      })
      .filter(Boolean) as Record<string, unknown>[];

    const muscleGroups = [
      ...new Set(
        resolvedExercises.flatMap((ex) => (ex.muscle_groups as string[]) ?? []),
      ),
    ];

    return {
      dayNumber: index + 1,
      dayName: day.dayName,
      muscleGroups,
      exercises: resolvedExercises,
    };
  });

  // Guard: fail fast if any day ended up with 0 exercises. This means the model
  // returned exercise IDs we don't recognise (all dropped) — a recoverable AI
  // quality failure, so surface it as PlanGenerationError → HTTP 502, not 500.
  const emptyDays = workoutDays.filter((d) => d.exercises.length === 0);
  if (emptyDays.length > 0) {
    throw new PlanGenerationError(
      `Days [${emptyDays.map((d) => d.dayName).join(", ")}] have 0 valid exercises (Gemini returned unknown IDs)`,
      [{ model: "post-validation", reason: "empty_days_after_id_resolution" }],
      false,
    );
  }

  // Resolve the recommended split (experience × days × painStatus matrix), then
  // honor the LLM's choice if it picked one of the listed alternates based on
  // user notes — otherwise fall back to the algorithmic primary.
  const recommendation = resolveEffectiveSplit(
    parsedQuiz.trainingSplit,
    parsedQuiz.workoutsPerWeek,
    parsedQuiz.experience,
    parsedQuiz.painStatus,
  );
  const finalSplitLabel = reconcileSplitWithLLMOutput(
    recommendation,
    workoutDays.map((d) => d.dayName),
  );
  if (finalSplitLabel !== recommendation.effectiveSplit) {
    console.log(
      `[Gemini] Split honored from LLM choice: "${finalSplitLabel}" (algorithm primary was "${recommendation.effectiveSplit}", alternates: [${recommendation.alternates.join(", ")}])`,
    );
  }
  const splitType = mapSplitType(finalSplitLabel);
  const targetMuscles = SPLIT_TARGET_MUSCLES[splitType] ?? [];
  const coveredMuscles = new Set(
    workoutDays.flatMap((d) =>
      d.exercises.flatMap((ex) => (ex.muscle_groups as string[]) ?? []),
    ),
  );
  const missingMuscleGroups = targetMuscles.filter(
    (mg) => !coveredMuscles.has(mg),
  );

  // Find back-friendly alternative exercises for missing muscle groups (not already in the plan)
  const usedIds = new Set(
    workoutDays.flatMap((d) => d.exercises.map((ex) => ex.id as number)),
  );
  const alternativeExercises: Record<string, unknown>[] = [];
  for (const mg of missingMuscleGroups) {
    const candidate =
      (allExercisesRaw as Record<string, unknown>[])
        .filter((ex) => !usedIds.has(ex.id as number))
        .filter((ex) => ((ex.muscle_groups as string[]) ?? []).includes(mg))
        .find((ex) => ex.is_back_friendly === true) ??
      (allExercisesRaw as Record<string, unknown>[])
        .filter((ex) => !usedIds.has(ex.id as number))
        .find((ex) => ((ex.muscle_groups as string[]) ?? []).includes(mg));
    if (
      candidate &&
      !alternativeExercises.find(
        (e) => (e.id as number) === (candidate.id as number),
      )
    ) {
      alternativeExercises.push(candidate);
    }
  }

  const isActive = (parsedQuiz.painStatus ?? "").toLowerCase().startsWith("active");
  const storedGoal = isActive
    ? ACTIVE_PAIN_GOAL
    : (parsedQuiz.originalGoal ?? parsedQuiz.goal);
  const storedOriginalGoal = isActive
    ? (parsedQuiz.originalGoal ?? (parsedQuiz.goal !== ACTIVE_PAIN_GOAL ? parsedQuiz.goal : undefined))
    : undefined;

  return {
    id: `ai-plan-${Date.now()}`,
    name: geminiPlan.planName,
    splitType,
    weeks: geminiPlan.weeks,
    createdAt: new Date().toISOString(),
    settings: {
      goal: storedGoal,
      originalGoal: storedOriginalGoal,
      workoutsPerWeek: parsedQuiz.workoutsPerWeek,
      duration: parsedQuiz.duration,
      experience: parsedQuiz.experience,
      trainingSplit: finalSplitLabel,
      exerciseVariability: parsedQuiz.exerciseVariability,
      units: parsedQuiz.units,
      cardio: parsedQuiz.cardio,
      stretching: parsedQuiz.stretching,
      gender: parsedQuiz.gender,
      height: parsedQuiz.height,
      heightUnit: parsedQuiz.heightUnit,
      weight: parsedQuiz.weight,
      weightUnit: parsedQuiz.weightUnit,
      birthYear: parsedQuiz.birthYear,
      dateOfBirth: parsedQuiz.dateOfBirth,
      bodyType: parsedQuiz.bodyType,
      painStatus: parsedQuiz.painStatus,
      painLocation: parsedQuiz.painLocation,
      painLevel: parsedQuiz.painLevel,
      painTriggers: parsedQuiz.painTriggers,
      canSquat: parsedQuiz.canSquat,
      additionalNotes: parsedQuiz.additionalNotes,
    },
    workoutDays,
    missingMuscleGroups,
    alternativeExercises,
  };
}
