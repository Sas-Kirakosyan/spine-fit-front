import {
  APICallError,
  JSONParseError,
  NoObjectGeneratedError,
  TypeValidationError,
  generateObject,
} from "ai";
import type { PromptExercise } from "../utils/exerciseFilter.js";
import type { ParsedQuizData } from "../types.js";
import {
  planResponseSchema,
  type PlanResponseValidated,
} from "../schemas/planSchema.js";
import {
  ACTIVE_PAIN_GOAL,
  buildSystemInstruction,
  buildUserPrompt,
  reconcileSplitWithLLMOutput,
  resolveEffectiveSplit,
} from "../utils/promptBuilder.js";
import { SPLIT_TARGET_MUSCLES, mapSplitType } from "../utils/splitUtils.js";

// Model IDs are AI Gateway identifiers ("creator/model"). First entry is the
// primary, the rest are fallbacks tried in order. Override via PLAN_MODELS
// (comma-separated) without touching code — handy for A/B testing.
const DEFAULT_PLAN_MODELS = [
  "anthropic/claude-haiku-4.5",
  "openai/gpt-5-mini",
];
const PLAN_TEMPERATURE = 0.3;

function getPlanModels(): string[] {
  const raw = process.env.PLAN_MODELS?.trim();
  if (!raw) return DEFAULT_PLAN_MODELS;
  return raw
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

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

/**
 * Map an AI SDK error to the code-prefixed attempt-reason taxonomy. The
 * prefix drives the retryable/terminal split in generatePlan: only attempts
 * that are pure service outages (AI_SERVICE_ERROR) are worth retrying.
 */
function classifyAttemptError(err: unknown): string {
  if (NoObjectGeneratedError.isInstance(err)) {
    // The model responded but the content is unusable — always terminal.
    const finishReason = err.finishReason;
    if (finishReason === "content-filter") {
      return `PROMPT_BLOCKED: ${finishReason}`;
    }
    if (finishReason && finishReason !== "stop") {
      return `BAD_FINISH_REASON: ${finishReason}`;
    }
    if (TypeValidationError.isInstance(err.cause)) {
      return `SCHEMA_VALIDATION_FAILED: ${err.cause.message}`;
    }
    if (JSONParseError.isInstance(err.cause)) {
      return `JSON_PARSE_FAILED: ${err.cause.message}`;
    }
    return `JSON_PARSE_FAILED: ${err.message}`;
  }
  if (APICallError.isInstance(err)) {
    const tag = err.isRetryable ? "AI_SERVICE_ERROR" : "AI_CONFIG_ERROR";
    return `${tag}: ${err.statusCode ?? "?"} ${err.message}`;
  }
  // Gateway errors (auth, rate limit, …) are not APICallError but carry a
  // statusCode; otherwise fall back to the permanent-pattern heuristic.
  const status = (err as { statusCode?: unknown } | null)?.statusCode;
  const msg = err instanceof Error ? err.message : String(err);
  if (typeof status === "number") {
    return status === 429 || status >= 500
      ? `AI_SERVICE_ERROR: ${status} ${msg}`
      : `AI_CONFIG_ERROR: ${status} ${msg}`;
  }
  const permanent =
    /\b(400|401|403)\b|api[_ ]?key|permission|unauthorized|invalid argument/i.test(
      msg,
    );
  return `${permanent ? "AI_CONFIG_ERROR" : "AI_SERVICE_ERROR"}: ${msg}`;
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
  options?: { modelOverride?: string },
): Promise<GeneratedPlanResult> {
  const prompt = buildUserPrompt(parsedQuiz, exercises);
  const system = buildSystemInstruction(parsedQuiz);

  const callModel = async (modelId: string): Promise<PlanResponseValidated> => {
    const result = await generateObject({
      model: modelId, // plain "creator/model" string → routed via AI Gateway
      system,
      prompt,
      temperature: PLAN_TEMPERATURE,
      // Preserve "one round-trip per model" semantics; the SDK default of 2
      // silent retries would blur per-model A/B timing and triple worst-case
      // latency of the fallback loop.
      maxRetries: 0,
      schema: planResponseSchema,
    });

    const usage = result.usage;
    console.log(
      `[AI ${modelId}] Tokens \n prompt: ${usage.inputTokens}\n reasoning: ${usage.outputTokenDetails?.reasoningTokens ?? 0}\n response: ${usage.outputTokens}\n total: ${usage.totalTokens}\n`,
    );
    if (result.warnings?.length) {
      console.warn(`[AI ${modelId}] Warnings:`, JSON.stringify(result.warnings));
    }

    return result.object; // already zod-validated against planResponseSchema
  };

  // Try each model in turn; an attempt = call → structured-output validation
  // (JSON parse + zod schema, handled inside generateObject). A single catch
  // covers BOTH transport errors AND parse/validation failures, so a bad
  // response from the primary model falls through to the fallback. When a
  // model override is given (dev A/B testing), only that model is tried so
  // timing/token logs stay clean. If all fail, throw a typed error.
  const models = options?.modelOverride
    ? [options.modelOverride]
    : getPlanModels();
  const attempts: { model: string; reason: string }[] = [];
  let aiPlan: PlanResponseValidated | null = null;
  for (const modelId of models) {
    const startedAt = Date.now();
    try {
      aiPlan = await callModel(modelId);
      console.log(
        `[AI] model=${modelId} ok in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`,
      );
      break;
    } catch (err) {
      const reason = classifyAttemptError(err);
      attempts.push({ model: modelId, reason });
      console.warn(
        `[AI] ⚠ Model "${modelId}" attempt failed in ${((Date.now() - startedAt) / 1000).toFixed(1)}s: ${reason}`,
      );
    }
  }
  if (!aiPlan) {
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
  console.log("aiPlan", JSON.stringify(aiPlan));

  // Build a lookup map from exercise ID → full exercise object
  const exerciseMap = new Map<number, Record<string, unknown>>();
  for (const ex of allExercisesRaw) {
    exerciseMap.set(ex.id as number, ex);
  }

  // Validate returned exercise IDs against the known exercise map
  const allReturnedIds = aiPlan.days.flatMap((d) =>
    d.exercises.map((e) => e.exerciseId),
  );
  const missingIds = allReturnedIds.filter((id) => !exerciseMap.has(id));
  if (missingIds.length > 0) {
    console.warn(
      `[AI] ⚠ ${missingIds.length} unknown exercise ID(s): [${missingIds.join(", ")}] — these will be dropped`,
    );
  }

  // Convert AI days → WorkoutDay[] (with full exercise objects)
  const workoutDays = aiPlan.days.map((day, index) => {
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
      `Days [${emptyDays.map((d) => d.dayName).join(", ")}] have 0 valid exercises (model returned unknown IDs)`,
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
      `[AI] Split honored from LLM choice: "${finalSplitLabel}" (algorithm primary was "${recommendation.effectiveSplit}", alternates: [${recommendation.alternates.join(", ")}])`,
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
    name: aiPlan.planName,
    splitType,
    weeks: aiPlan.weeks,
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
