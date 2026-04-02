import { GoogleGenerativeAI } from "@google/generative-ai";
import type { PromptExercise } from "../utils/exerciseFilter.js";
import type { ParsedQuizData } from "../types.js";
import { PLAN_SCHEMA, type GeminiPlanResponse } from "../schemas/planSchema.js";
import {
  buildSystemInstruction,
  buildUserPrompt,
} from "../utils/promptBuilder.js";
import { SPLIT_TARGET_MUSCLES, mapSplitType } from "../utils/splitUtils.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// Shape compatible with the frontend's GeneratedPlan type from @spinefit/shared
export interface GeneratedPlanResult {
  id: string;
  name: string;
  splitType: string;
  weeks: number;
  createdAt: string;
  settings: {
    goal: string;
    workoutsPerWeek: string;
    duration: string;
    durationRange?: string;
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
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash", // gemini-3.1-flash-lite-preview
    systemInstruction: buildSystemInstruction(parsedQuiz.duration, parsedQuiz.painLevel),
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: PLAN_SCHEMA,
    },
  });

  const prompt = buildUserPrompt(parsedQuiz, exercises);
  const result = await model.generateContent(prompt);

  const usage = result.response.usageMetadata;
  if (usage) {
    const thinking =
      (usage as unknown as Record<string, unknown>).thoughtsTokenCount ?? 0;
    console.log(
      `[Gemini ${model.model}] Tokens \n prompt: ${usage.promptTokenCount}\n thinking: ${thinking}\n response: ${usage.candidatesTokenCount}\n total: ${usage.totalTokenCount}\n`,
    );
  }

  const text = result.response.text();
  const geminiPlan = JSON.parse(text) as GeminiPlanResponse;
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

  // Guard: fail fast if any day ended up with 0 exercises
  const emptyDays = workoutDays.filter((d) => d.exercises.length === 0);
  if (emptyDays.length > 0) {
    throw new Error(
      `Plan generation failed: days [${emptyDays.map((d) => d.dayName).join(", ")}] have 0 valid exercises (Gemini returned unknown IDs)`,
    );
  }

  // Compute missing muscle groups
  const splitType = mapSplitType(parsedQuiz.trainingSplit);
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

  return {
    id: `ai-plan-${Date.now()}`,
    name: geminiPlan.planName,
    splitType,
    weeks: geminiPlan.weeks,
    createdAt: new Date().toISOString(),
    settings: {
      goal: parsedQuiz.goal,
      workoutsPerWeek: parsedQuiz.workoutsPerWeek,
      duration: parsedQuiz.duration,
      durationRange: parsedQuiz.durationRange,
      experience: parsedQuiz.experience,
      trainingSplit: parsedQuiz.trainingSplit,
      exerciseVariability: parsedQuiz.exerciseVariability,
      units: parsedQuiz.units,
      cardio: parsedQuiz.cardio,
      stretching: parsedQuiz.stretching,
      gender: parsedQuiz.gender,
      height: parsedQuiz.height,
      heightUnit: parsedQuiz.heightUnit,
      weight: parsedQuiz.weight,
      weightUnit: parsedQuiz.weightUnit,
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
