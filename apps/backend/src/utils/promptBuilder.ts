import type { PromptExercise } from "./exerciseFilter.js";
import type { ParsedQuizData } from "../types.js";

export function formatExercisesAsTable(exercises: PromptExercise[]): string {
  const header = "ID|Name|Muscles|Equipment|Difficulty|BackFriendly|Restrictions";
  const rows = exercises.map((ex) => {
    const muscles = ex.muscle_groups.join(",");
    const restrictions = ex.restrictions.length
      ? ex.restrictions.map((r) => `${r.issue_type}:${r.restriction_level}`).join(",")
      : "none";
    return `${ex.id}|${ex.name}|${muscles}|${ex.equipment}|${ex.difficulty}|${ex.is_back_friendly}|${restrictions}`;
  });
  return [header, ...rows].join("\n");
}

export function exerciseCountForDuration(duration: string): string {
  const lower = duration.toLowerCase();
  if (/under\s*30|<\s*30/.test(lower)) return "2-3";
  if (/30\s*[-–]\s*45/.test(lower)) return "4-5";
  if (/45\s*[-–]\s*60/.test(lower)) return "5-7";
  if (/30\s*[-–]\s*60/.test(lower)) return "4-7";
  if (/60\s*[-–]\s*90/.test(lower)) return "7-9";
  if (/90/.test(lower)) return "8-12";

  const match = lower.match(/\d+/);
  const mins = match ? parseInt(match[0], 10) : NaN;

  if (!isNaN(mins)) {
    if (mins <= 30) return "2-3";
    if (mins <= 45) return "4-5";
    if (mins <= 60) return "5-7";
    if (mins <= 90) return "7-9";
    return "8-10";
  }
  return "4-6";
}

export function buildSystemInstruction(duration: string, painLevel?: number): string {
  const exerciseRange = exerciseCountForDuration(duration);

  // Derive pain-level sub-rule for Rule 13
  const painLevelGuidance =
    painLevel !== undefined && painLevel >= 7
      ? `\n    - Pain level ${painLevel}/10 (severe): RPE 4-5 maximum, 2 sets only, bodyweight or minimal load preferred. Include "Consult your physician before increasing intensity." in the pain rule.`
      : painLevel !== undefined && painLevel >= 4
        ? `\n    - Pain level ${painLevel}/10 (moderate): stay at the lower bound of Active Symptoms targets; do not progress load until pain drops below 4.`
        : "";

  return `You are an expert spine-safe fitness coach specializing in back rehabilitation.

RULES (apply to every plan you generate):
1. Only reference exercises provided in the user message using their numeric "id" as "exerciseId". Never invent or hallucinate exercise IDs.
2. PRE-APPROVED LIST: All exercises in the provided list have already been filtered and approved for this user's pain status, experience level, and pain triggers. Do NOT re-filter or skip exercises based on safety assumptions — trust the list. Your job is to select the best combination from it, not to second-guess what is safe.
3. CORE STABILITY MANDATE: If painStatus is "Active Symptoms" or "Recovered", every training day MUST include at least 1 core stability exercise chosen from the provided exercise list (prefer exercises targeting core, abs, or spine stabilizers). If no core stability exercise exists in the list, skip this requirement rather than inventing one.
4. CONTEXT AWARENESS: The user's pain status tells you how to calibrate intensity, volume, and notes — not which exercises to exclude (that is already done). "Healthy" = train for performance. "Recovered" = build strength conservatively. "Active Symptoms" = prioritize pain-free movement and low fatigue.
5. Match exercise difficulty to user experience level.
6. Include ${exerciseRange} exercises per day — scaled to fit the session duration of ${duration}. A typical exercise takes 8-12 minutes (sets + rest). Do NOT exceed the upper bound.
7. Set weight to 0 for bodyweight exercises; suggest a starter weight for weighted ones.
8. MOVEMENT PATTERN BALANCE: Every Upper Body day or Full Body day MUST include both a vertical pull (lat pulldown, pull-up, cable pulldown) AND a horizontal pull (seated row, cable row, machine row). Never program only one pull plane per session.
9. PUSH REQUIREMENT: Every Full Body or Upper Body day MUST include at least 1 push movement (chest press, overhead press, push-up, or dip variation).
10. LOWER BODY & SQUAT CONFIDENCE: Every Full Body day MUST include at least 1 lower body compound exercise. If squat confidence starts with "Avoidant" or "Technical", substitute squat patterns with hip hinge (Romanian deadlift, good morning) or leg press — never program barbell/goblet squats for these users.
11. VOLUME CONTROL: Do not include more than 2 exercises targeting the same movement pattern in a single session (e.g., no 3 row variations in one day, no 3 chest press variants). For Active Symptoms plans, limit to 1 exercise per movement pattern.
12. EXERCISE DIVERSITY: Never repeat the same exercise (same exerciseId) more than once within a single training day.
13. INTENSITY BY PAIN STATUS:
    - "Active Symptoms": RPE 5-6 in W1, conservative load, high rep (12-15), short sets.${painLevelGuidance}
    - "Recovered": RPE 6-7 in W1, moderate load.
    - "Healthy": RPE 7-8 in W1, standard progressive overload (5 kg increments for compounds, 2.5 kg for isolation).
14. NOTES FIELD FORMAT: For every exercise, write the notes field using this exact structure (all parts on one line, separated by " | "):
    "[progression] | [load rule] | [pain rule if applicable]"
    - [progression]: "W1: {sets}×{reps} | W2: {sets}×{reps+2} | W3: {sets+1}×{reps} | W4: {sets+1}×{reps+2}"
    - [load rule]: "Increase weight by 2.5 kg (or 5 lb) when all reps completed with good form."
    - [pain rule]: Include ONLY for Active Symptoms or Recovered — "If pain increases → reduce load or ROM. Sharp/nerve pain → stop immediately."
    Set the sets/reps fields to Week 1 values.
15. ADDITIONAL USER NOTES: If "Additional user notes" are present in the user profile, treat them as high-priority personal constraints or preferences. They override default choices (e.g. a user saying "I hate machines, prefer free weights" should shift equipment selection accordingly).
16. PLAN NAME: Set planName to a concise descriptive name, e.g. "Back Rehab Full Body 4W" or "Strength Upper/Lower 4W".
17. WEEKS: Always set weeks to 4.
18. RULE VIOLATIONS: If you cannot satisfy a structural rule (rules 3, 8, 9, 10, 11) because the provided exercise list lacks the required movement type, omit that requirement silently rather than inventing an exercise ID. Never hallucinate an exercise to satisfy a rule.`;
}

function buildSplitDayGuidance(trainingSplit: string): string {
  const s = trainingSplit.toLowerCase();
  if (s.includes("push") && s.includes("pull") && s.includes("legs")) {
    return `SPLIT DAY STRUCTURE (Push / Pull / Legs):
- Push day  → chest, front_delts, triceps
- Pull day  → lats, upper_back, rear_delts, biceps  (must include vertical pull + horizontal pull)
- Legs day  → quadriceps, hamstrings, glutes`;
  }
  if (s.includes("upper") && s.includes("lower")) {
    return `SPLIT DAY STRUCTURE (Upper / Lower):
- Upper day → chest, lats, upper_back, front_delts, rear_delts, triceps, biceps  (must include vertical pull + horizontal pull)
- Lower day → quadriceps, hamstrings, glutes`;
  }
  if (s.includes("full body")) {
    return `SPLIT DAY STRUCTURE (Full Body):
- Every day covers: push pattern + pull pattern + lower body compound + core
- Alternate emphasis across days: Day A = squat focus + horizontal push/pull; Day B = hinge focus + vertical push/pull
- Must include vertical pull on at least half of the training days`;
  }
  if (s.includes("bro split")) {
    return `SPLIT DAY STRUCTURE (Bro Split — Back-Safe):
- Dedicate each day to a specific muscle group, e.g.: Chest/Triceps, Back/Biceps, Legs, Shoulders, Arms
- Back day must include both vertical pull (lat pulldown / pull-up) and horizontal pull (row)`;
  }
  return "";
}

export function buildUserPrompt(quiz: ParsedQuizData, exercises: PromptExercise[]): string {
  const daysCount = quiz.workoutsPerWeek.replace(/\D+/g, "").trim() || "3";
  const splitGuidance = buildSplitDayGuidance(quiz.trainingSplit);

  const variabilityLine = quiz.exerciseVariability
    ? `- Exercise variability: ${quiz.exerciseVariability} (${quiz.exerciseVariability.toLowerCase().includes("high") ? "rotate exercises across days, avoid repeating the same exercise on consecutive days" : "keep movements consistent across weeks for skill development"})`
    : "";

  return `Create a structured ${quiz.workoutsPerWeek} training plan.

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
- Preferred units: ${quiz.units}${quiz.additionalNotes ? `\n- Additional user notes: ${quiz.additionalNotes}` : ""}
${variabilityLine}
${splitGuidance ? `\n${splitGuidance}\n` : ""}
AVAILABLE EXERCISES (use only IDs from this list):
EXERCISE FORMAT: ID|Name|Muscles|Equipment|Difficulty|BackFriendly|Restrictions(type:level,...)
${formatExercisesAsTable(exercises)}

ADDITIONAL CONSTRAINTS FOR THIS REQUEST:
- Each training day must fit within ${quiz.duration}
- Return exactly ${daysCount} unique training days
- Use "${quiz.units}" as the weight_unit`;
}
