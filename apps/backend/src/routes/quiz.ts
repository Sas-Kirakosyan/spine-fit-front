import { Router } from "express";
import type { Request, Response } from "express";
import { createRequire } from "module";
import { prepareExercisesForPrompt } from "../utils/exerciseFilter.js";
import { generatePlan } from "../services/geminiService.js";
import type { ParsedQuizData } from "../types.js";

const require = createRequire(import.meta.url);
const allExercisesRaw: Record<string, unknown>[] = require("../../../../packages/shared/src/MockData/allExercise.json");

interface QuizAnswers {
  workoutType: "gym";
  answers: Record<number, number | number[] | string | Record<string, string | number>>;
  units?: Record<number, string | Record<string, string>>;
  timestamp?: string;
}


function determineSplitName(experience: string, frequency: string, painStatus?: string): string {
  const freq = parseInt(frequency, 10) || 3;

  if (freq === 2) return "Full Body ×2";

  if (freq === 3) {
    if (experience === "Beginner") return "Full Body A / B / C";
    if (experience === "Intermediate") return "Upper / Lower / Upper";
    // Advanced
    const isPainMinimal = !painStatus || painStatus === "Healthy" || painStatus === "Recovered";
    return isPainMinimal ? "Push / Pull / Legs" : "Upper / Lower / Upper";
  }

  if (freq === 4) {
    if (experience === "Beginner") return "Full Body ×4";
    return "Upper / Lower ×4";
  }

  // 5+
  if (experience === "Beginner" || experience === "Intermediate") return "Upper / Lower ×5";
  return "Bro Split (Back-Safe)";
}

function parseDuration(durationRange: string): string {
  const midpoints: Record<string, string> = {
    "10–20 min": "15 min",
    "20–30 min": "25 min",
    "30–45 min": "35 min",
    "45–60 min": "50 min",
  };
  return midpoints[durationRange] ?? "35 min";
}

const QUESTIONS = {
  GOAL: 2,
  STATS: 3,
  BODY_TYPE: 7,
  EXPERIENCE: 8,
  TRAINING_FREQUENCY: 9,
  PAIN_STATUS: 10,
  PAIN_LOCATION: 11,
  PAIN_LEVEL: 12,
  PAIN_TRIGGERS: 13,
  SQUAT_CONFIDENCE: 14,
  WORKOUT_DURATION: 15,
  ADDITIONAL_NOTES: 16,
} as const;

function parseQuizAnswers(data: QuizAnswers): ParsedQuizData {
  const { answers, units: rawUnits } = data;

  // Goal
  const goalOptions = [
    "Muscle Hypertrophy (Build mass safely with back/sciatica history)",
    "Structural Recovery (Reduce pain and restore movement capacity)",
  ];
  const goal = typeof answers[QUESTIONS.GOAL] === "number" ? goalOptions[answers[QUESTIONS.GOAL] as number] : goalOptions[0];

  // Baseline stats (multi_field)
  let gender: string | undefined;
  let height: string | undefined;
  let weight: string | undefined;
  let dateOfBirth: string | undefined;

  const stats = answers[QUESTIONS.STATS];
  if (stats && typeof stats === "object" && !Array.isArray(stats)) {
    const s = stats as Record<string, string | number>;
    gender = typeof s.gender === "string" ? s.gender : undefined;
    height = s.height !== undefined ? String(s.height) : undefined;
    weight = s.weight !== undefined ? String(s.weight) : undefined;
    dateOfBirth = typeof s.dateOfBirth === "string" ? s.dateOfBirth : undefined;
  }

  // Units for stats question
  let heightUnit = "cm";
  let weightUnit = "kg";
  const unitsQ3 = rawUnits?.[QUESTIONS.STATS];
  if (unitsQ3 && typeof unitsQ3 === "object" && !Array.isArray(unitsQ3)) {
    const u = unitsQ3 as Record<string, string>;
    heightUnit = u.height ?? "cm";
    weightUnit = u.weight ?? "kg";
  }

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
  const painStatusOptions = ["Healthy", "Recovered", "Active Symptoms"];
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
    "Walking long distances",
    "Bending forward (Flexion)",
    "Lifting objects from the floor",
    "Sitting for long durations",
    "High-impact movement (Running/Jumping)",
    "Weighted Squats or Deadlifts",
    "Other functional movements",
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
  const durationOptions = ["10–20 min", "20–30 min", "30–45 min", "45–60 min"];
  const durationRange = typeof answers[QUESTIONS.WORKOUT_DURATION] === "number" ? durationOptions[answers[QUESTIONS.WORKOUT_DURATION] as number] : "30–45 min";
  const duration = parseDuration(durationRange);

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
    durationRange,
    experience,
    trainingSplit,
    exerciseVariability: "Balanced",
    units: weightUnit,
    cardio: "Off",
    stretching: "Off",
    gender,
    height,
    heightUnit,
    weight,
    weightUnit,
    dateOfBirth,
    bodyType,
    painStatus,
    painLocation,
    ...(Number.isFinite(painLevel) && { painLevel }),
    painTriggers,
    canSquat,
    additionalNotes,
  };
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

    const plan = await generatePlan(parsed, filteredExercises, allExercisesRaw);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[AI] ✅ Done in ${elapsed}s`);

    console.log(`\n[AI RESPONSE] Plan: "${plan.name}" | Split: ${plan.splitType}`);
    console.log(`[AI RESPONSE] ${plan.workoutDays.length} workout days:`);
    for (const day of plan.workoutDays) {
      const exerciseNames = day.exercises.map((ex) => (ex as Record<string, unknown>).name ?? `#${(ex as Record<string, unknown>).id}`);
      console.log(`  Day ${day.dayNumber} (${day.dayName}): ${day.exercises.length} exercises — [${exerciseNames.join(", ")}]`);
      console.log(`    Muscle groups: [${day.muscleGroups.join(", ")}]`);
    }

    const responsePayload = { success: true, planSettings: parsed, plan };
    console.log(`\n[RES] Sending 200 — payload size: ${JSON.stringify(responsePayload).length} bytes`);
    console.log("========== END /api/quiz ==========\n");

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("Quiz parsing error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
