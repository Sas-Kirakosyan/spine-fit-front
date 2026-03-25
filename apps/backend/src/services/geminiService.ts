import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import type { PromptExercise } from "../utils/exerciseFilter.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// ── Types ────────────────────────────────────────────────────────────────────

export interface ParsedQuizData {
  goal: string;
  workoutsPerWeek: string;
  duration: string;
  durationRange: string;
  experience: string;
  trainingSplit: string;
  exerciseVariability: string;
  units: string;
  cardio: string;
  stretching: string;
  gender?: string;
  height?: string;
  heightUnit: string;
  weight?: string;
  weightUnit: string;
  dateOfBirth?: string;
  bodyType?: string;
  painStatus?: string;
  painLocation?: string[];
  painLevel?: number;
  painTriggers?: string[];
  canSquat?: string;
}

interface GeminiExercise {
  exerciseId: number;
  sets: number;
  reps: number;
  weight: number;
  weight_unit: string;
  notes?: string;
}

interface GeminiDay {
  dayName: string;
  exercises: GeminiExercise[];
}

interface GeminiPlanResponse {
  planName: string;
  trainingSplit: string;
  weeks: number;
  days: GeminiDay[];
}

// Shape compatible with the frontend's GeneratedPlan type from @spinefit/shared
export interface GeneratedPlanResult {
  id: string;
  name: string;
  splitType: string;
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

// ── Response Schema ──────────────────────────────────────────────────────────

const PLAN_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    planName: { type: SchemaType.STRING },
    trainingSplit: { type: SchemaType.STRING },
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
  required: ["planName", "trainingSplit", "weeks", "days"],
};

// ── Prompt Builder ───────────────────────────────────────────────────────────

function buildPrompt(quiz: ParsedQuizData, exercises: PromptExercise[]): string {
  const daysCount = quiz.workoutsPerWeek.replace(/\D+/g, "").trim() || "3";
  return `You are an expert spine-safe fitness coach. Create a structured ${quiz.workoutsPerWeek} training plan.

USER PROFILE:
- Goal: ${quiz.goal}
- Experience: ${quiz.experience}
- Training split: ${quiz.trainingSplit}
- Session duration: ${quiz.duration}
- Pain status: ${quiz.painStatus ?? "Healthy"}
- Pain locations: ${quiz.painLocation?.join(", ") ?? "None"}
- Pain level (0-10): ${quiz.painLevel ?? 0}
- Pain triggers: ${quiz.painTriggers?.join(", ") ?? "None"}
- Squat confidence: ${quiz.canSquat ?? "Confident"}
- Preferred units: ${quiz.units}

AVAILABLE EXERCISES (use only IDs from this list):
${JSON.stringify(exercises)}

RULES:
1. Only reference exercises from the list above using their numeric "id" as "exerciseId"
2. If painStatus is "Active Symptoms", only select exercises where is_back_friendly is true
3. Avoid exercises with restriction_level "high" that match the user's pain triggers
4. Match exercise difficulty to user experience level
5. Each training day must fit within ${quiz.duration}
6. Return exactly ${daysCount} unique training days
7. Include 3-5 exercises per day
8. Set weight to 0 for bodyweight exercises; suggest a starter weight for weighted ones
9. Use "${quiz.units}" as the weight_unit`;
}

// ── Split type mapper ────────────────────────────────────────────────────────

function mapSplitType(split: string): string {
  if (/Full Body.*A.*B.*C/i.test(split)) return "FULL_BODY_ABC";
  if (/Full Body.*A.*B/i.test(split)) return "FULL_BODY_AB";
  if (/Full Body/i.test(split)) return "FULL_BODY_4X";
  if (/Upper.*Lower.*Upper/i.test(split)) return "UPPER_LOWER_UPPER";
  if (/Upper.*Lower/i.test(split)) return "UPPER_LOWER_4X";
  if (/Push.*Pull.*Legs/i.test(split)) return "PUSH_PULL_LEGS";
  if (/Bro Split/i.test(split)) return "BRO_SPLIT";
  return "FULL_BODY_ABC";
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function generatePlan(
  parsedQuiz: ParsedQuizData,
  exercises: PromptExercise[],
  allExercisesRaw: Record<string, unknown>[],
): Promise<GeneratedPlanResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: PLAN_SCHEMA,
    },
  });

  const prompt = buildPrompt(parsedQuiz, exercises);
  const result = await model.generateContent(prompt);

  const usage = result.response.usageMetadata;
  if (usage) {
    const thinking = (usage as unknown as Record<string, unknown>).thoughtsTokenCount ?? 0;
    console.log(
      `[Gemini ${model.model}] Tokens \n prompt: ${usage.promptTokenCount}\n thinking: ${thinking}\n response: ${usage.candidatesTokenCount}\n total: ${usage.totalTokenCount}\n`,
    );
  }

  const text = result.response.text();
  const geminiPlan = JSON.parse(text) as GeminiPlanResponse;

  // Build a lookup map from exercise ID → full exercise object
  const exerciseMap = new Map<number, Record<string, unknown>>();
  for (const ex of allExercisesRaw) {
    exerciseMap.set(ex.id as number, ex);
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
      ...new Set(resolvedExercises.flatMap((ex) => (ex.muscle_groups as string[]) ?? [])),
    ];

    return {
      dayNumber: index + 1,
      dayName: day.dayName,
      muscleGroups,
      exercises: resolvedExercises,
    };
  });

  return {
    id: `ai-plan-${Date.now()}`,
    name: geminiPlan.planName,
    splitType: mapSplitType(geminiPlan.trainingSplit),
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
    },
    workoutDays,
    missingMuscleGroups: [],
    alternativeExercises: [],
  };
}
