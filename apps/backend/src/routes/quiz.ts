import { Router } from "express";
import type { Request, Response } from "express";
import { createRequire } from "module";
import { prepareExercisesForPrompt } from "../utils/exerciseFilter.js";
import { generatePlan, PlanGenerationError } from "../services/aiService.js";
import type { ParsedQuizData } from "../types.js";
import { quizSettingsSchema } from "../schemas/quizSettingsSchema.js";
import { resolveEffectiveSplit } from "../utils/promptBuilder.js";

// Keep in sync with packages/shared/src/quiz/constants.ts (GOAL_OPTIONS).
// Backend does not depend on @spinefit/shared at build time.
const GOAL_OPTIONS = [
  "Build Muscle & Strength",
  "Continue Rehab & Recovery",
] as const;

const require = createRequire(import.meta.url);
const allExercisesRaw: Record<string, unknown>[] = require("../../../../packages/shared/src/MockData/allExercise.json");

interface QuizAnswers {
  workoutType: "gym";
  answers: Record<number, number | number[] | string | Record<string, string | number>>;
  units?: Record<number, string | Record<string, string>>;
  timestamp?: string;
}


function determineSplitName(experience: string, frequency: string, painStatus?: string): string {
  // Delegate to the matrix-based recommender so quiz-time selection and
  // runtime reconciliation share one source of truth.
  return resolveEffectiveSplit(
    "",
    `${frequency} days per week`,
    experience,
    painStatus,
  ).effectiveSplit;
}

const QUESTIONS = {
  GOAL: 3,
  PAIN_STATUS: 2,
  PAIN_LOCATION: 4,
  PAIN_LEVEL: 5,
  PAIN_TRIGGERS: 6,
  SQUAT_CONFIDENCE: 7,
  EXPERIENCE: 8,
  TRAINING_FREQUENCY: 9,
  WORKOUT_DURATION: 10,
  GENDER: 11,
  BIRTH_YEAR: 12,
  BODY_TYPE: 13,
  ADDITIONAL_NOTES: 14,
} as const;

function parseQuizAnswers(data: QuizAnswers): ParsedQuizData {
  const { answers } = data;

  // Goal — Q3 is hidden when painStatus is Active Symptoms (index 0), so default
  // to recovery rather than hypertrophy when no goal was answered.
  const goalDefault = answers[QUESTIONS.PAIN_STATUS] === 0 ? GOAL_OPTIONS[1] : GOAL_OPTIONS[0];
  const goal = typeof answers[QUESTIONS.GOAL] === "number" ? GOAL_OPTIONS[answers[QUESTIONS.GOAL] as number] : goalDefault;

  // Gender (standalone radio: 0=Male, 1=Female, 2=Other)
  const genderOptions = ["Male", "Female", "Other"];
  const gender = typeof answers[QUESTIONS.GENDER] === "number"
    ? genderOptions[answers[QUESTIONS.GENDER] as number]
    : undefined;

  // Birth year (number input) — validate range: 1900 to (currentYear - 5)
  const birthYearRaw = answers[QUESTIONS.BIRTH_YEAR];
  const birthYearParsed = birthYearRaw !== undefined ? parseInt(String(birthYearRaw), 10) : NaN;
  const currentYear = new Date().getFullYear();
  const birthYear = !isNaN(birthYearParsed) && birthYearParsed >= 1900 && birthYearParsed <= currentYear - 5
    ? birthYearParsed
    : undefined;

  // height/weight come from Profile (regenerate endpoint only); defaults kept for schema compat
  const heightUnit = "cm";
  const weightUnit = "kg";

  // Body type (gender-dependent)
  let bodyType: string | undefined;
  if (typeof answers[QUESTIONS.BODY_TYPE] === "number") {
    const isFemale = gender === "Female";
    const options = isFemale ? ["18-24", "25-31", "32-38", "38+"] : ["8-15", "16-22", "23-30", "30+"];
    bodyType = options[answers[QUESTIONS.BODY_TYPE] as number];
  }

  // Experience
  const experienceOptions = ["Beginner", "Intermediate", "Advanced"];
  const experience = typeof answers[QUESTIONS.EXPERIENCE] === "number" ? experienceOptions[answers[QUESTIONS.EXPERIENCE] as number] : "Intermediate";

  // Training frequency
  const frequencyOptions = ["2", "3", "4", "5+"];
  const trainingFrequency = typeof answers[QUESTIONS.TRAINING_FREQUENCY] === "number" ? frequencyOptions[answers[QUESTIONS.TRAINING_FREQUENCY] as number] : "3";
  const workoutsPerWeek = `${trainingFrequency.replace("+", "")} days per week`;

  // Pain status
  // Keep in sync with packages/shared/src/quiz/constants.ts (PAIN_STATUS_QUIZ_OPTIONS order).
  const painStatusOptions = ["Active Symptoms", "Recovered", "Healthy"];
  const painStatus = typeof answers[QUESTIONS.PAIN_STATUS] === "number" ? painStatusOptions[answers[QUESTIONS.PAIN_STATUS] as number] : undefined;

  // Pain location (checkbox → array of indices)
  const painLocationOptions = [
    "Lower Back (L4-L5/S1 area)",
    "Sciatica (Pain radiating down leg)",
    "Glute / Deep Hip discomfort",
    "Calf or Foot (Numbness/Tingling)",
  ];
  const painLocation = Array.isArray(answers[QUESTIONS.PAIN_LOCATION])
    ? (answers[QUESTIONS.PAIN_LOCATION] as number[]).map((i) => painLocationOptions[i])
    : undefined;

  // Pain level (slider 0-10)
  const painLevel = answers[QUESTIONS.PAIN_LEVEL] !== undefined ? Number(answers[QUESTIONS.PAIN_LEVEL]) : undefined;

  // Pain triggers (checkbox → array of indices)
  const painTriggersOptions = [
    "Bending forward (e.g., reaching for the floor)",
    "Arching backward (e.g., reaching overhead)",
    "Lifting or carrying heavy objects",
    "Sitting for longer than 20–30 minutes",
    "Impact movements (Running, Jumping)",
    "Rotating or twisting the torso",
    "Straining (Heavy bracing/holding breath)",
  ];
  const painTriggers = Array.isArray(answers[QUESTIONS.PAIN_TRIGGERS])
    ? (answers[QUESTIONS.PAIN_TRIGGERS] as number[]).map((i) => painTriggersOptions[i])
    : undefined;

  // Squat confidence
  const canSquatOptions = [
    "Confident (I squat with weights regularly)",
    "Cautious (I only squat with light weights)",
    "Technical (I can squat bodyweight, but weights trigger pain)",
    "Avoidant (I strictly avoid all squatting movements)",
    "Untested (I haven't tried squatting recently)",
  ];
  const canSquat = typeof answers[QUESTIONS.SQUAT_CONFIDENCE] === "number" ? canSquatOptions[answers[QUESTIONS.SQUAT_CONFIDENCE] as number] : undefined;

  // Workout duration
  const durationOptions = ["10–20 min", "20–30 min", "30–45 min", "45–60 min", "60–90 min"];
  const duration = typeof answers[QUESTIONS.WORKOUT_DURATION] === "number" ? durationOptions[answers[QUESTIONS.WORKOUT_DURATION] as number] : "30–45 min";

  // Additional notes (optional textarea)
  const additionalNotes = typeof answers[QUESTIONS.ADDITIONAL_NOTES] === "string"
    ? (answers[QUESTIONS.ADDITIONAL_NOTES] as string).trim() || undefined
    : undefined;

  // Derived fields
  const trainingSplit = determineSplitName(experience, trainingFrequency, painStatus);

  return {
    goal,
    workoutsPerWeek,
    duration,
    experience,
    trainingSplit,
    exerciseVariability: "Balanced",
    units: weightUnit,
    cardio: "Off",
    stretching: "Off",
    gender,
    birthYear,
    heightUnit,
    weightUnit,
    bodyType,
    painStatus,
    painLocation,
    ...(Number.isFinite(painLevel) && { painLevel }),
    painTriggers,
    canSquat,
    additionalNotes,
  };
}

// Dev-only A/B override: ?model=creator/model-id forces a single Gateway model
// (no fallback) so per-model timing/token logs stay clean. Disabled in prod.
const MODEL_ID_RE = /^[\w.-]+\/[\w.:-]+$/;
function devModelOverride(req: Request): string | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  const m = req.query.model;
  return typeof m === "string" && MODEL_ID_RE.test(m) ? m : undefined;
}

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log("\n========== POST /api/quiz ==========");
  console.log("[REQ] Raw body:", JSON.stringify(req.body, null, 2));

  try {
    const data = req.body as QuizAnswers;

    if (!data.answers || typeof data.answers !== "object") {
      console.log("[REQ] ❌ Invalid quiz data — missing or bad 'answers' field");
      return res.status(400).json({ error: "Invalid quiz data" });
    }

    console.log(`[REQ] Answer keys: [${Object.keys(data.answers).join(", ")}]`);

    const parsed = parseQuizAnswers(data);
    console.log("\n[PARSED] Quiz answers:\n", JSON.stringify(parsed, null, 2));

    const filteredExercises = prepareExercisesForPrompt(
      allExercisesRaw as Parameters<typeof prepareExercisesForPrompt>[0],
      parsed.painStatus,
      { experience: parsed.experience, painTriggers: parsed.painTriggers },
    );
    console.log(`[FILTER] ${filteredExercises.length} exercises sent to AI (from ${allExercisesRaw.length} total)`);

    const plan = await generatePlan(parsed, filteredExercises, allExercisesRaw, {
      modelOverride: devModelOverride(req),
    });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[AI] ✅ Done in ${elapsed}s`);

    console.log(`\n[AI RESPONSE] Plan: "${plan.name}" | Split: ${plan.splitType}`);
    console.log(`[AI RESPONSE] ${plan.workoutDays.length} workout days:`);
    for (const day of plan.workoutDays) {
      const exerciseNames = day.exercises.map((ex) => (ex as Record<string, unknown>).name ?? `#${(ex as Record<string, unknown>).id}`);
      console.log(`  Day ${day.dayNumber} (${day.dayName}): ${day.exercises.length} exercises — [${exerciseNames.join(", ")}]`);
      console.log(`    Muscle groups: [${day.muscleGroups.join(", ")}]`);
    }

    const responsePayload = { success: true, plan };
    console.log(`\n[RES] Sending 200 — payload size: ${JSON.stringify(responsePayload).length} bytes`);
    console.log("========== END /api/quiz ==========\n");

    return res.status(200).json(responsePayload);
  } catch (error) {
    if (error instanceof PlanGenerationError) {
      if (error.retryable) {
        console.error("[AI] ⏳ AI unavailable (retryable). Attempts:", JSON.stringify(error.attempts));
        return res.status(503).json({
          error: "AI is temporarily unavailable. Please retry.",
          code: "ai_unavailable",
        });
      }
      console.error("[AI] ❌ Plan generation failed (terminal). Attempts:", JSON.stringify(error.attempts));
      return res.status(502).json({
        error: "AI failed to generate a valid plan. Please try again.",
        code: "ai_generation_failed",
      });
    }
    console.error("Quiz parsing error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/regenerate", async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log("\n========== POST /api/quiz/regenerate ==========");
  console.log("[REQ] Settings body:", JSON.stringify(req.body, null, 2));

  try {
    const parseResult = quizSettingsSchema.safeParse(req.body);
    if (!parseResult.success) {
      console.log("[REQ] ❌ Validation failed:", JSON.stringify(parseResult.error.flatten(), null, 2));
      return res.status(400).json({
        error: "Invalid settings",
        details: parseResult.error.flatten().fieldErrors,
      });
    }
    const parsed = parseResult.data as ParsedQuizData;

    console.log("\n[PARSED] Regenerate settings:\n", JSON.stringify(parsed, null, 2));

    const filteredExercises = prepareExercisesForPrompt(
      allExercisesRaw as Parameters<typeof prepareExercisesForPrompt>[0],
      parsed.painStatus,
      { experience: parsed.experience, painTriggers: parsed.painTriggers },
    );
    console.log(`[FILTER] ${filteredExercises.length} exercises sent to AI (from ${allExercisesRaw.length} total)`);

    const plan = await generatePlan(parsed, filteredExercises, allExercisesRaw, {
      modelOverride: devModelOverride(req),
    });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[AI] ✅ Done in ${elapsed}s`);

    console.log(`\n[AI RESPONSE] Plan: "${plan.name}" | Split: ${plan.splitType}`);
    console.log(`[AI RESPONSE] ${plan.workoutDays.length} workout days:`);
    for (const day of plan.workoutDays) {
      const exerciseNames = day.exercises.map((ex) => (ex as Record<string, unknown>).name ?? `#${(ex as Record<string, unknown>).id}`);
      console.log(`  Day ${day.dayNumber} (${day.dayName}): ${day.exercises.length} exercises — [${exerciseNames.join(", ")}]`);
      console.log(`    Muscle groups: [${day.muscleGroups.join(", ")}]`);
    }

    const responsePayload = { success: true, plan };
    console.log(`\n[RES] Sending 200 — payload size: ${JSON.stringify(responsePayload).length} bytes`);
    console.log("========== END /api/quiz/regenerate ==========\n");

    return res.status(200).json(responsePayload);
  } catch (error) {
    if (error instanceof PlanGenerationError) {
      if (error.retryable) {
        console.error("[AI] ⏳ Regenerate: AI unavailable (retryable). Attempts:", JSON.stringify(error.attempts));
        return res.status(503).json({
          error: "AI is temporarily unavailable. Please retry.",
          code: "ai_unavailable",
        });
      }
      console.error("[AI] ❌ Regenerate failed (terminal). Attempts:", JSON.stringify(error.attempts));
      return res.status(502).json({
        error: "AI failed to generate a valid plan. Please try again.",
        code: "ai_generation_failed",
      });
    }
    console.error("Regenerate plan error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
