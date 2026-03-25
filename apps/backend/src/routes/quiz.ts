import { Router } from "express";
import type { Request, Response } from "express";
import { createRequire } from "module";
import { prepareExercisesForPrompt } from "../utils/exerciseFilter.js";
import { generatePlan } from "../services/geminiService.js";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const allExercisesRaw: Record<string, unknown>[] = require("../../../../packages/shared/src/MockData/allExercise.json");

interface QuizAnswers {
  workoutType: "gym";
  answers: Record<number, number | number[] | string | Record<string, string | number>>;
  units?: Record<number, string | Record<string, string>>;
  timestamp?: string;
}

interface ParsedQuizData {
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

function parseQuizAnswers(data: QuizAnswers): ParsedQuizData {
  const { answers, units: rawUnits } = data;

  // Q2: Goal
  const goalOptions = [
    "Muscle Hypertrophy (Build mass safely with back/sciatica history)",
    "Structural Recovery (Reduce pain and restore movement capacity)",
  ];
  const goal = typeof answers[2] === "number" ? goalOptions[answers[2]] : goalOptions[0];

  // Q3: Baseline stats (multi_field)
  let gender: string | undefined;
  let height: string | undefined;
  let weight: string | undefined;
  let dateOfBirth: string | undefined;

  const stats = answers[3];
  if (stats && typeof stats === "object" && !Array.isArray(stats)) {
    const s = stats as Record<string, string | number>;
    gender = typeof s.gender === "string" ? s.gender : undefined;
    height = s.height !== undefined ? String(s.height) : undefined;
    weight = s.weight !== undefined ? String(s.weight) : undefined;
    dateOfBirth = typeof s.dateOfBirth === "string" ? s.dateOfBirth : undefined;
  }

  // Units for Q3
  let heightUnit = "cm";
  let weightUnit = "kg";
  const unitsQ3 = rawUnits?.[3];
  if (unitsQ3 && typeof unitsQ3 === "object" && !Array.isArray(unitsQ3)) {
    const u = unitsQ3 as Record<string, string>;
    heightUnit = u.height ?? "cm";
    weightUnit = u.weight ?? "kg";
  }

  // Q7: Body type (gender-dependent)
  let bodyType: string | undefined;
  if (typeof answers[7] === "number") {
    const isFemale = gender === "Female";
    const options = isFemale ? ["18-24", "25-31", "32-38", "38+"] : ["8-15", "16-22", "23-30", "30+"];
    bodyType = options[answers[7] as number];
  }

  // Q8: Experience
  const experienceOptions = ["Beginner", "Intermediate", "Advanced"];
  const experience = typeof answers[8] === "number" ? experienceOptions[answers[8]] : "Intermediate";

  // Q9: Training frequency
  const frequencyOptions = ["2", "3", "4", "5+"];
  const trainingFrequency = typeof answers[9] === "number" ? frequencyOptions[answers[9]] : "3";
  const workoutsPerWeek = `${trainingFrequency.replace("+", "")} days per week`;

  // Q10: Pain status
  const painStatusOptions = ["Healthy", "Recovered", "Active Symptoms"];
  const painStatus = typeof answers[10] === "number" ? painStatusOptions[answers[10]] : undefined;

  // Q11: Pain location (checkbox → array of indices)
  const painLocationOptions = [
    "Lower Back (L4-L5/S1 area)",
    "Sciatica (Pain radiating down leg)",
    "Glute / Deep Hip discomfort",
    "Calf or Foot (Numbness/Tingling)",
  ];
  const painLocation = Array.isArray(answers[11])
    ? (answers[11] as number[]).map((i) => painLocationOptions[i])
    : undefined;

  // Q12: Pain level (slider 0-10)
  const painLevel = answers[12] !== undefined ? Number(answers[12]) : undefined;

  // Q13: Pain triggers (checkbox → array of indices)
  const painTriggersOptions = [
    "Walking long distances",
    "Bending forward (Flexion)",
    "Lifting objects from the floor",
    "Sitting for long durations",
    "High-impact movement (Running/Jumping)",
    "Weighted Squats or Deadlifts",
    "Other functional movements",
  ];
  const painTriggers = Array.isArray(answers[13])
    ? (answers[13] as number[]).map((i) => painTriggersOptions[i])
    : undefined;

  // Q14: Squat confidence
  const canSquatOptions = [
    "Confident (I squat with weights regularly)",
    "Cautious (I only squat with light weights)",
    "Technical (I can squat bodyweight, but weights trigger pain)",
    "Avoidant (I strictly avoid all squatting movements)",
    "Untested (I haven't tried squatting recently)",
  ];
  const canSquat = typeof answers[14] === "number" ? canSquatOptions[answers[14]] : undefined;

  // Q15: Workout duration
  const durationOptions = ["10–20 min", "20–30 min", "30–45 min", "45–60 min"];
  const durationRange = typeof answers[15] === "number" ? durationOptions[answers[15]] : "30–45 min";
  const duration = parseDuration(durationRange);

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
  };
}

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const data = req.body as QuizAnswers;

  if (!data.answers || typeof data.answers !== "object") {
    res.status(400).json({ error: "Invalid quiz data" });
    return;
  }

  const parsed = parseQuizAnswers(data);
  console.log("Parsed quiz answers:\n", JSON.stringify(parsed, null, 2));

  const filteredExercises = prepareExercisesForPrompt(
    allExercisesRaw as Parameters<typeof prepareExercisesForPrompt>[0],
    parsed.painStatus,
  );

  try {
    const plan = await generatePlan(parsed, filteredExercises, allExercisesRaw);
    console.log(`Generated plan "${plan.name}" with ${plan.workoutDays.length} days`);
    res.status(200).json({ success: true, planSettings: parsed, plan });
  } catch (error) {
    console.error("Gemini plan generation failed:", error);
    res.status(500).json({
      error: "Failed to generate plan",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
